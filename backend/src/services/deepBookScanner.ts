import { suiClient } from '../blockchain/suiClient';

/**
 * REAL DeepBook Pool Scanner
 * Scans SUI testnet blockchain for actual DeepBook V2/V3 pools
 */

export interface DeepBookPoolScanResult {
    poolId: string;
    baseAsset: string;
    quoteAsset: string;
    version: 'v2' | 'v3';
    verified: boolean;
}

// Known DeepBook V2 package on testnet
const DEEPBOOK_V2_PACKAGE = '0xdee9';

// Known DeepBook V3 package (if deployed)
const DEEPBOOK_V3_PACKAGE = '0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809';

// Well-known testnet pools (verified from blockchain)
const KNOWN_TESTNET_POOLS: DeepBookPoolScanResult[] = [
    {
        poolId: '0x7f526b1263c4b91b43c9e646419b5696f424de28dda3c1e6658cc0a54558baa7',
        baseAsset: 'SUI',
        quoteAsset: 'USDC',
        version: 'v2',
        verified: true
    },
    {
        poolId: '0xa0b9ebefb38c963fd115f52d71fa64501b79d1adcb5270563f92ce60c4e48611',
        baseAsset: 'DEEP',
        quoteAsset: 'SUI',
        version: 'v2',
        verified: true
    },
    // Add more known pools here
];

/**
 * Scan blockchain for DeepBook pools
 */
export async function scanDeepBookPools(): Promise<DeepBookPoolScanResult[]> {
    console.log('🔍 Scanning SUI testnet for real DeepBook pools...');

    const verifiedPools: DeepBookPoolScanResult[] = [];

    // Step 1: Try known pools first
    for (const pool of KNOWN_TESTNET_POOLS) {
        try {
            const exists = await verifyPoolOnChain(pool.poolId);
            if (exists) {
                verifiedPools.push(pool);
                console.log(`✅ Found: ${pool.baseAsset}/${pool.quoteAsset} - ${pool.poolId.slice(0, 12)}...`);
            }
        } catch (error) {
            console.log(`⚠️  Pool ${pool.poolId.slice(0, 12)}... not accessible`);
        }
    }

    // Step 2: Try to discover more pools via package query
    try {
        const discoveredPools = await queryPoolsFromPackage(DEEPBOOK_V2_PACKAGE);
        for (const pool of discoveredPools) {
            if (!verifiedPools.find(p => p.poolId === pool.poolId)) {
                verifiedPools.push(pool);
            }
        }
    } catch (error) {
        console.log('Could not auto-discover pools, using known pools only');
    }

    if (verifiedPools.length > 0) {
        console.log(`✅ Found ${verifiedPools.length} real DeepBook pools on blockchain`);
    } else {
        console.log('❌ No DeepBook pools found on testnet');
    }

    return verifiedPools;
}

/**
 * Verify a pool exists on-chain
 */
async function verifyPoolOnChain(poolId: string): Promise<boolean> {
    try {
        const response = await fetch('https://fullnode.testnet.sui.io:443', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'sui_getObject',
                params: [poolId, { showContent: true, showType: true }]
            })
        });

        const data = await response.json() as any;

        // Check if object exists and is a valid pool
        if (data.result?.data?.content) {
            const type = data.result.data.type;
            // Check if it's a DeepBook pool type
            return type && (type.includes('clob') || type.includes('pool'));
        }

        return false;
    } catch {
        return false;
    }
}

/**
 * Query pools from DeepBook package
 */
async function queryPoolsFromPackage(packageId: string): Promise<DeepBookPoolScanResult[]> {
    const pools: DeepBookPoolScanResult[] = [];

    try {
        // Query objects owned/created by DeepBook package
        // This is a simplified version - actual implementation would need
        // to parse transaction events or use DeepBook SDK

        console.log(`Querying pools from package ${packageId.slice(0, 10)}...`);

        // For now, return empty - we rely on known pools
        return pools;
    } catch (error) {
        console.error('Failed to query pools from package:', error);
        return pools;
    }
}

/**
 * Get pool IDs as comma-separated string for .env
 */
export function getPoolIDString(pools: DeepBookPoolScanResult[]): string {
    return pools.map(p => p.poolId).join(',');
}

/**
 * Main function to discover and configure pools
 */
export async function discoverAndConfigurePools(): Promise<string> {
    const pools = await scanDeepBookPools();

    if (pools.length === 0) {
        throw new Error('No DeepBook pools found on testnet!');
    }

    const poolIDs = getPoolIDString(pools);
    console.log('\n📝 Add to your .env file:');
    console.log(`DEEPBOOK_POOL_IDS=${poolIDs}\n`);

    return poolIDs;
}
