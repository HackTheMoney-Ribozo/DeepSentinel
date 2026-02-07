import { TransactionBlock } from '@mysten/sui.js/transactions';
import { suiClient } from './suiClient';
import { config } from '../config';

/**
 * PTB Builder for constructing complex Programmable Transaction Blocks
 */
export class PTBBuilder {
    /**
     * Build a simple transfer PTB
     */
    buildTransfer(recipient: string, amount: bigint): TransactionBlock {
        const tx = new TransactionBlock();
        const [coin] = tx.splitCoins(tx.gas, [amount]);
        tx.transferObjects([coin], recipient);
        return tx;
    }

    /**
     * Build PTB to create arbitrage vault
     */
    buildCreateVault(): TransactionBlock {
        const tx = new TransactionBlock();

        tx.moveCall({
            target: `${config.deepbook.packageId || config.sui.network}::vault::create_vault`,
            arguments: [],
        });

        return tx;
    }

    /**
     * Build PTB to deposit into vault
     */
    buildDeposit(vaultId: string, amount: bigint): TransactionBlock {
        const tx = new TransactionBlock();

        const [coin] = tx.splitCoins(tx.gas, [amount]);

        tx.moveCall({
            target: `${config.deepbook.packageId}::vault::deposit`,
            arguments: [
                tx.object(vaultId),
                coin,
            ],
        });

        return tx;
    }

    /**
     * Build PTB to withdraw from vault
     */
    buildWithdraw(vaultId: string, amount: bigint): TransactionBlock {
        const tx = new TransactionBlock();

        tx.moveCall({
            target: `${config.deepbook.packageId}::vault::withdraw`,
            arguments: [
                tx.object(vaultId),
                tx.pure.u64(amount),
            ],
        });

        return tx;
    }

    /**
     * Build flash arbitrage PTB (simplified for MVP)
     * In production, this would integrate with DeepBook flash loans
     */
    buildFlashArbitrage(
        vaultId: string,
        poolA: string,
        poolB: string,
        amount: bigint
    ): TransactionBlock {
        const tx = new TransactionBlock();

        // For MVP: Just record the arbitrage execution
        // In production: This would do flash loan → swap A → swap B → repay → profit
        tx.moveCall({
            target: `${config.deepbook.packageId}::vault::execute_arbitrage`,
            arguments: [
                tx.object(vaultId),
                tx.pure.u64(0), // Profit amount (calculated off-chain for MVP)
            ],
        });

        return tx;
    }

    /**
     * Build multi-step arbitrage PTB with DeepBook integration
     * This is a template for future DeepBook V3 integration
     */
    buildDeepBookArbitrage(
        vaultId: string,
        poolA: string,
        poolB: string,
        amount: bigint,
        deepbookPackageId: string
    ): TransactionBlock {
        const tx = new TransactionBlock();

        // Step 1: Flash loan from DeepBook
        // const [flashLoan] = tx.moveCall({
        //   target: `${deepbookPackageId}::clob_v2::flash_loan`,
        //   arguments: [tx.object(poolA), tx.pure.u64(amount)],
        // });

        // Step 2: Swap on Pool A
        // const [swapResultA] = tx.moveCall({
        //   target: `${deepbookPackageId}::clob_v2::swap_exact_base_for_quote`,
        //   arguments: [tx.object(poolA), flashLoan],
        // });

        // Step 3: Swap on Pool B
        // const [swapResultB] = tx.moveCall({
        //   target: `${deepbookPackageId}::clob_v2::swap_exact_quote_for_base`,
        //   arguments: [tx.object(poolB), swapResultA],
        // });

        // Step 4: Repay flash loan + capture profit
        // tx.moveCall({
        //   target: `${deepbookPackageId}::clob_v2::repay_flash_loan`,
        //   arguments: [tx.object(poolA), swapResultB],
        // });

        // For MVP: Placeholder
        tx.moveCall({
            target: `${config.deepbook.packageId}::vault::execute_arbitrage`,
            arguments: [tx.object(vaultId), tx.pure.u64(0)],
        });

        return tx;
    }

    /**
     * Estimate gas for a transaction
     */
    async estimateGas(tx: TransactionBlock): Promise<bigint> {
        try {
            const dryRun = await suiClient.dryRunTransaction(tx);
            const gasUsed = dryRun.effects.gasUsed;
            const total = BigInt(gasUsed.computationCost) + BigInt(gasUsed.storageCost);
            return total;
        } catch (error) {
            console.error('Gas estimation failed:', error);
            return BigInt(1_000_000); // Default 0.001 SUI
        }
    }
}

// Export singleton instance
export const ptbBuilder = new PTBBuilder();
