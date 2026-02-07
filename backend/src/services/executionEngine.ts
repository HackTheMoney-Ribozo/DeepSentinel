import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { suiClient } from '../blockchain/suiClient';
import { ptbBuilder } from '../blockchain/ptbBuilder';
import { ArbitrageOpportunity, SimulationResult, ExecutionResult, SafetyCheck } from '../types';
import { config } from '../config';
import { dataCollector } from './dataCollector';

/**
 * Autonomous Execution Engine
 * Safely executes arbitrage transactions with simulation and safety checks
 */

export class ExecutionEngine {
    private isShutdown = false;
    private consecutiveFailures = 0;
    private dailyLoss = 0;
    private lastResetTime = Date.now();
    private executing = false;

    // Safety limits
    private readonly MAX_CONSECUTIVE_FAILURES = 5;
    private readonly MAX_DAILY_LOSS = parseFloat(process.env.MAX_DAILY_LOSS || '10'); // $10 default
    private readonly MAX_POSITION_SIZE = parseFloat(process.env.MAX_POSITION_SIZE || '1000'); // $1000 default

    /**
     * Execute arbitrage opportunity with full safety checks
     */
    async executeArbitrage(
        opportunity: ArbitrageOpportunity,
        tradeSize: number
    ): Promise<ExecutionResult> {
        // Prevent concurrent executions
        if (this.executing) {
            return {
                success: false,
                error: 'Execution already in progress',
            };
        }

        this.executing = true;
        const startTime = Date.now();

        try {
            // Step 1: Safety checks
            const safetyCheck = this.checkSafety(opportunity, tradeSize);
            if (!safetyCheck.passed) {
                return {
                    success: false,
                    error: `Safety check failed: ${safetyCheck.warnings.join(', ')}`,
                };
            }

            // Step 2: Build PTB
            console.log(`📦 Building PTB for ${opportunity.id}...`);
            const ptb = this.buildArbitragePTB(opportunity, tradeSize);

            // Step 3: Simulate transaction
            console.log('🔬 Simulating transaction...');
            const simulation = await this.simulateTransaction(ptb);

            if (!simulation.success) {
                this.consecutiveFailures++;
                return {
                    success: false,
                    error: `Simulation failed: ${simulation.error}`,
                };
            }

            // Step 4: Verify simulation shows profit
            if (simulation.estimatedProfit <= 0) {
                return {
                    success: false,
                    error: `Simulation shows no profit: $${simulation.estimatedProfit.toFixed(4)}`,
                };
            }

            // Step 5: Execute transaction
            console.log('⚡ Executing transaction...');
            const result = await this.executeTransaction(ptb);

            const executionTime = Date.now() - startTime;

            if (result.success) {
                this.consecutiveFailures = 0; // Reset on success
                console.log(`✅ Success! Profit: $${result.profit} | Gas: $${result.gasCost} | Time: ${executionTime}ms`);
            } else {
                this.consecutiveFailures++;
                this.dailyLoss += result.gasCost || 0;
                console.error(`❌ Execution failed: ${result.error}`);
            }

            return {
                ...result,
                executionTimeMs: executionTime,
            };

        } catch (error: any) {
            this.consecutiveFailures++;
            console.error('💥 Execution error:', error);

            return {
                success: false,
                error: error.message || 'Unknown execution error',
            };
        } finally {
            this.executing = false;
            this.resetDailyLossIfNeeded();
        }
    }

    /**
     * Build arbitrage PTB with real flash loan logic
     */
    private buildArbitragePTB(opportunity: ArbitrageOpportunity, tradeSize: number): TransactionBlock {
        // For now, use the PTBBuilder's method
        // TODO: Implement real DeepBook flash loan sequence
        const vaultId = process.env.VAULT_PACKAGE_ID || '';

        return ptbBuilder.buildFlashArbitrage(
            vaultId,
            opportunity.poolA.poolId,
            opportunity.poolB.poolId,
            BigInt(Math.floor(tradeSize * 1e9)) // Convert to MIST
        );
    }

    /**
     * Simulate transaction before execution
     */
    async simulateTransaction(ptb: TransactionBlock): Promise<SimulationResult> {
        try {
            const dryRun = await suiClient.dryRunTransaction(ptb);

            // Check if dry run succeeded
            if (dryRun.effects.status.status !== 'success') {
                return {
                    success: false,
                    estimatedProfit: 0,
                    estimatedGas: 0,
                    estimatedSlippage: 0,
                    warnings: [],
                    error: dryRun.effects.status.error || 'Simulation failed',
                };
            }

            // Parse gas cost
            const gasUsed = dryRun.effects.gasUsed;
            const gasCost = Number(BigInt(gasUsed.computationCost) + BigInt(gasUsed.storageCost)) / 1e9;

            // Parse events to find profit (if any)
            // This is simplified - in production, parse actual profit from events
            const estimatedProfit = 0; // TODO: Parse from transaction effects

            return {
                success: true,
                estimatedProfit,
                estimatedGas: gasCost,
                estimatedSlippage: 0, // TODO: Calculate from pool states
                warnings: [],
            };
        } catch (error: any) {
            return {
                success: false,
                estimatedProfit: 0,
                estimatedGas: 0,
                estimatedSlippage: 0,
                warnings: [],
                error: error.message || 'Simulation error',
            };
        }
    }

    /**
     * Execute transaction on blockchain
     */
    private async executeTransaction(ptb: TransactionBlock): Promise<ExecutionResult> {
        try {
            // Get keypair from environment
            const privateKey = config.sui.privateKey;

            if (!privateKey) {
                return {
                    success: false,
                    error: 'No private key configured. Set SUI_PRIVATE_KEY in .env',
                };
            }

            // Parse private key (remove 0x if present)
            const keyBytes = privateKey.startsWith('0x')
                ? privateKey.slice(2)
                : privateKey;

            const keypair = Ed25519Keypair.fromSecretKey(
                Uint8Array.from(Buffer.from(keyBytes, 'hex'))
            );

            // Execute transaction
            const result = await suiClient.executeTransaction(ptb, keypair);

            // Check if transaction succeeded
            if (result.effects?.status?.status !== 'success') {
                return {
                    success: false,
                    error: result.effects?.status?.error || 'Transaction failed',
                };
            }

            // Parse gas cost
            const gasUsed = result.effects?.gasUsed;
            const gasCost = gasUsed
                ? Number(BigInt(gasUsed.computationCost) + BigInt(gasUsed.storageCost)) / 1e9
                : 0;

            // Parse profit from events
            // TODO: Parse actual profit from transaction events
            const profit = 0;

            return {
                success: true,
                transactionHash: result.digest,
                profit,
                gasCost,
                slippage: 0, // TODO: Calculate actual slippage
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Execution failed',
            };
        }
    }

    /**
     * Safety checks before execution
     */
    private checkSafety(opportunity: ArbitrageOpportunity, tradeSize: number): SafetyCheck {
        const warnings: string[] = [];

        // Check if circuit breaker is active
        const circuitBreakerActive = this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES;
        if (circuitBreakerActive) {
            warnings.push(`Circuit breaker active: ${this.consecutiveFailures} consecutive failures`);
        }

        // Check daily loss limit
        const dailyLossExceeded = this.dailyLoss >= this.MAX_DAILY_LOSS;
        if (dailyLossExceeded) {
            warnings.push(`Daily loss limit exceeded: $${this.dailyLoss.toFixed(2)}`);
        }

        // Check position size limit
        const positionTooLarge = tradeSize > this.MAX_POSITION_SIZE;
        if (positionTooLarge) {
            warnings.push(`Position size too large: $${tradeSize} > $${this.MAX_POSITION_SIZE}`);
        }

        // Check if shutdown
        if (this.isShutdown) {
            warnings.push('Execution engine is shutdown');
        }

        const passed = !circuitBreakerActive &&
            !dailyLossExceeded &&
            !positionTooLarge &&
            !this.isShutdown;

        return {
            passed,
            dailyLossLimit: !dailyLossExceeded,
            positionSizeLimit: !positionTooLarge,
            consecutiveFailures: !circuitBreakerActive,
            circuitBreakerActive,
            warnings,
        };
    }

    /**
     * Reset daily loss counter every 24 hours
     */
    private resetDailyLossIfNeeded() {
        const now = Date.now();
        const hoursSinceReset = (now - this.lastResetTime) / (1000 * 60 * 60);

        if (hoursSinceReset >= 24) {
            console.log(`🔄 Resetting daily loss counter (was $${this.dailyLoss.toFixed(2)})`);
            this.dailyLoss = 0;
            this.lastResetTime = now;
        }
    }

    /**
     * Emergency shutdown
     */
    shutdown() {
        console.log('🛑 Emergency shutdown activated');
        this.isShutdown = true;
    }

    /**
     * Restart after shutdown
     */
    restart() {
        console.log('♻️  Restarting execution engine');
        this.isShutdown = false;
        this.consecutiveFailures = 0;
    }

    /**
     * Get execution stats
     */
    getStats() {
        return {
            isShutdown: this.isShutdown,
            consecutiveFailures: this.consecutiveFailures,
            dailyLoss: this.dailyLoss,
            hoursSinceReset: (Date.now() - this.lastResetTime) / (1000 * 60 * 60),
            circuitBreakerActive: this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES,
        };
    }
}

// Export singleton
export const executionEngine = new ExecutionEngine();
