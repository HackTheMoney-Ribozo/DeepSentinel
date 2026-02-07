
# DeepBook Pool Creation Instructions

## Step 1: Get Testnet USDC
Visit: https://faucet.circle.com/
- Network: Sui Testnet
- Address: 0xa40c1fa3743bb51f90370ec05bc3fc7229cc8df657655468a204d42f1deeb76f
- Amount: 20 USDC

## Step 2: Find DeepBook Registry
The registry ID can be found from DeepBook docs or by querying the package.

## Step 3: Create Pool
```bash
sui client call \
  --package 0x0da0c9764feec0b77f72abf73c949e3ff3e85c5ed20db5c8e3e859c8a87b6e88 \
  --module pool \
  --function create_pool \
  --type-args "0x2::sui::SUI" "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC" \
  --args <REGISTRY_ID> 1000000 1 \
  --gas-budget 100000000
```

## Step 4: Note the Pool Object ID
From the transaction output, find the created Pool object ID and add it to backend/.env:
```
DEEPBOOK_POOL_IDS=<your_pool_id>
```
