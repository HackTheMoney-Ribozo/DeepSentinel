import { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { config } from '../config';

/**
 * Wrapper around Sui SDK client with helper methods
 */
export class SuiClientWrapper {
    private client: SuiClient;

    constructor() {
        this.client = new SuiClient({ url: config.sui.rpcUrl });
    }

    /**
     * Get the underlying SuiClient instance
     */
    getClient(): SuiClient {
        return this.client;
    }

    /**
     * Get SUI balance for an address
     */
    async getBalance(address: string): Promise<bigint> {
        const balance = await this.client.getBalance({ owner: address });
        return BigInt(balance.totalBalance);
    }

    /**
     * Get all coins owned by an address
     */
    async getCoins(address: string, coinType?: string) {
        return await this.client.getCoins({ owner: address, coinType });
    }

    /**
     * Execute a transaction block
     */
    async executeTransaction(
        tx: TransactionBlock,
        signer: any
    ): Promise<SuiTransactionBlockResponse> {
        const result = await this.client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
                showEvents: true,
            },
        });

        return result;
    }

    /**
     * Get object details by ID
     */
    async getObject(objectId: string) {
        return await this.client.getObject({
            id: objectId,
            options: {
                showContent: true,
                showOwner: true,
                showType: true,
            },
        });
    }

    /**
     * Get dynamic field object
     */
    async getDynamicFieldObject(parentId: string, name: any) {
        return await this.client.getDynamicFieldObject({
            parentId,
            name,
        });
    }

    /**
     * Get events by transaction
     */
    async getEvents(txDigest: string) {
        const tx = await this.client.getTransactionBlock({
            digest: txDigest,
            options: {
                showEvents: true,
            },
        });
        return tx.events || [];
    }

    /**
     * Wait for transaction confirmation
     */
    async waitForTransactionBlock(txDigest: string): Promise<SuiTransactionBlockResponse> {
        return await this.client.waitForTransactionBlock({
            digest: txDigest,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });
    }

    /**
     * Get current epoch
     */
    async getCurrentEpoch(): Promise<string> {
        const epoch = await this.client.getLatestSuiSystemState();
        return epoch.epoch;
    }

    /**
     * Dry run a transaction to estimate gas
     */
    async dryRunTransaction(tx: TransactionBlock): Promise<any> {
        return await this.client.dryRunTransactionBlock({
            transactionBlock: await tx.build({ client: this.client }),
        });
    }
}

// Export singleton instance
export const suiClient = new SuiClientWrapper();
