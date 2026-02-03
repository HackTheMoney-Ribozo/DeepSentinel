# DeepSentinel - Automated Arbitrage on Sui

🚀 **Automated arbitrage system leveraging Sui's Programmable Transaction Blocks (PTBs) and DeepBook V3**

## 🎯 What is DeepSentinel?

DeepSentinel monitors DeepBook liquidity pools 24/7, detects arbitrage opportunities, and executes atomic multi-step transactions using flash loans - all powered by Sui's unique capabilities.

## ✨ Features

- 🔍 **Real-time Pool Monitoring** - Track multiple DeepBook pools simultaneously
- ⚡ **Flash Loan Arbitrage** - Execute capital-efficient trades using DeepBook V3 flash loans
- 🔐 **Atomic Execution** - Multi-step PTBs ensure all-or-nothing transaction safety
- 📊 **Live Dashboard** - Monitor opportunities and profits in real-time
- 🎯 **Rule-Based Logic** - Simple, reliable arbitrage detection

## 🏗️ Architecture

```
Frontend (React) ←→ Backend (Node.js) ←→ Sui Blockchain
    ↓                    ↓                      ↓
 Dashboard         Pool Monitor          Smart Contracts
 Wallet            PTB Builder           (Move)
 Analytics         Arbitrage Engine      DeepBook V3
```

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Blockchain**: Sui Move + DeepBook V3
- **SDK**: @mysten/sui + @mysten/dapp-kit

## 📁 Project Structure

```
deepsentinel/
├── contracts/       # Sui Move smart contracts
├── backend/         # Node.js backend server
├── frontend/        # React dashboard
├── scripts/         # Deployment scripts
└── docs/           # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Sui CLI (testnet)
- Testnet SUI tokens

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Run development servers
npm run dev
```

### Deploy Smart Contracts

```bash
cd contracts
sui move build
sui client publish --gas-budget 100000000
```

## 📖 Documentation

- [MVP Plan](../brain/mvp_plan.md)
- [Tech Stack](../brain/tech_stack.md)
- [Task Breakdown](../brain/task.md)

## 🎯 Why Sui?

DeepSentinel leverages Sui's unique features:

- **PTBs**: Multi-step atomic transactions impossible on other chains
- **DeepBook V3**: Native CLOB with flash loan support
- **Parallel Execution**: High-performance transaction processing
- **Low Gas Costs**: Enables profitable small arbitrages
- **390ms Finality**: Near-instant settlement

## 📝 License

MIT

## 🙏 Acknowledgments

Built for the Sui Hackathon - leveraging the power of Move and PTBs to bring efficient arbitrage to DeFi.
# DeepSentinel
