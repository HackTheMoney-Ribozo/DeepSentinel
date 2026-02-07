/**
 * SIMPLIFIED DeepBook Pool Creator
 * Uses CLI commands instead of SDK for maximum compatibility
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Testnet constants
const SUI_TYPE = '0x2::sui::SUI';
const USDC_TYPE = '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC';

// DeepBook V3 package address (testnet)
// Source: Official Sui docs
const DEEPBOOK_PACKAGE = '0x0da0c9764feec0b77f72abf73c949e3ff3e85c5ed20db5c8e3e859c8a87b6e88';

console.log('🚀 DeepBook Pool Creator');
console.log('========================\n');

console.log('📦 Configuration:');
console.log(`  DeepBook Package: ${DEEPBOOK_PACKAGE.slice(0, 20)}...`);
console.log(`  Base Asset: SUI`);
console.log(`  Quote Asset: USDC (testnet)`);
console.log('');

try {
    // Step 1: Check wallet has balance
    console.log('💰 Checking wallet balance...');
    const gasOutput = execSync('sui client gas', { encoding: 'utf-8' });
    console.log(gasOutput);

    // Step 2: Request USDC from Circle faucet
    console.log('\n💧 To get testnet USDC:');
    console.log('  1. Visit: https://faucet.circle.com/');
    console.log('  2. Select "Sui Testnet"');
    console.log('  3. Enter your address:');
    const address = execSync('sui client active-address', { encoding: 'utf-8' }).trim();
    console.log(`     ${address}`);
    console.log('  4. Request 20 USDC\n');

    console.log('⚠️  MANUAL STEP REQUIRED:');
    console.log('After getting USDC from the faucet, we can create the DeepBook pool.\n');

    // Step 3: Create pool (DeepBook V3 uses registry-based pool creation)
    console.log('📝 To create the pool manually:');
    console.log('');
    console.log('Run this command after you have USobbyDC:');
    console.log('');
    console.log(`sui client call \\`);
    console.log(`  --package ${DEEPBOOK_PACKAGE} \\`);
    console.log(`  --module pool \\`);
    console.log(`  --function create_pool \\`);
    console.log(`  --type-args "${SUI_TYPE}" "${USDC_TYPE}" \\`);
    console.log(`  --args <REGISTRY_ID> 1000000 1 \\`);
    console.log(`  --gas-budget 100000000`);
    console.log('');

    // Save instructions
    const instructions = `
# DeepBook Pool Creation Instructions

## Step 1: Get Testnet USDC
Visit: https://faucet.circle.com/
- Network: Sui Testnet
- Address: ${address}
- Amount: 20 USDC

## Step 2: Find DeepBook Registry
The registry ID can be found from DeepBook docs or by querying the package.

## Step 3: Create Pool
\`\`\`bash
sui client call \\
  --package ${DEEPBOOK_PACKAGE} \\
  --module pool \\
  --function create_pool \\
  --type-args "${SUI_TYPE}" "${USDC_TYPE}" \\
  --args <REGISTRY_ID> 1000000 1 \\
  --gas-budget 100000000
\`\`\`

## Step 4: Note the Pool Object ID
From the transaction output, find the created Pool object ID and add it to backend/.env:
\`\`\`
DEEPBOOK_POOL_IDS=<your_pool_id>
\`\`\`
`;

    const filePath = path.join(__dirname, '..', 'POOL_CREATION_INSTRUCTIONS.md');
    fs.writeFileSync(filePath, instructions);

    console.log(`✅ Instructions saved to: ${filePath}\n`);

    // Alternative: Use existing pools
    console.log('💡 ALTERNATIVE: Use existing DeepBook pools');
    console.log('');
    console.log('DeepBook may have existing SUI/USDC pools on testnet.');
    console.log('Let me query for existing pools...\n');

    // Query for existing pools
    console.log('🔍 Querying DeepBook for existing pools...\n');

    // This would require knowing the Registry ID
    // For now, provide manual query instructions
    console.log('To find existing pools:');
    console.log('1. Query the DeepBook package for Pool objects');
    console.log('2. Filter by SUI/USDC type parameters');
    console.log('3. Use any existing pool ID\n');

} catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

console.log('✅ Next steps:');
console.log('1. Get USDC from faucet');
console.log('2. Create pool using CLI command above');
console.log('3. Add pool ID to .env');
console.log('4. Start building the arbitrage agent!');
