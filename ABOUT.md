# About StellarP2P Lending Protocol

## 🎯 Mission

To pioneer an open, transparent, and direct Peer-to-Peer (P2P) lending protocol on the Stellar blockchain, eliminating intermediaries and allowing lenders and borrowers to agree on custom interest rates and loan terms.

## 📖 Overview

**StellarP2P** is an on-chain escrow lending protocol built on Soroban that enables:

- **Lenders** to define custom loan offers with individualized interest rates (APR) and durations.
- **Borrowers** to browse an open marketplace of offers and instantly fund their positions upon acceptance.
- **Automated Settlement** where the smart contract locks funds in escrow and handles repayments and default conditions.

## 🔐 Why Stellar & Soroban?

- ✅ **Sub-Second Finality**: Transactions settle in ~5 seconds with Stellar consensus.
- ✅ **Micro-Fees**: Transaction costs of a fraction of a cent make micro-loans viable.
- ✅ **State Isolation**: Independent `LoanOffer` contracts and storage keys ensure clean escrow state management.
- ✅ **Freighter Integration**: Native browser extension wallet signing.

## 🏗️ Protocol Architecture

### 1. Smart Contract (Soroban Rust)
- **State Machine**: Tracks each loan through 4 states: `Active` $\rightarrow$ `Funded` $\rightarrow$ `Repaid` (or `Defaulted`).
- **Storage**: Persistent storage keyed by unique `loan_id` and indexed per user address.

### 2. Frontend Interface (Next.js 14)
- **P2P Marketplace**: Live browsing of open peer loan offers with real-time rate calculations.
- **Offer Creator**: Direct modal interface for publishing custom loan offers to the blockchain.
- **Positions Tracker**: Dual-view dashboard for managing loans provided vs. active borrowings.

## 🔄 Roadmap

- **Phase 1**: ✅ Core P2P Escrow contract and unit tests
- **Phase 2**: ✅ Next.js 14 P2P Marketplace UI & Freighter Wallet integration
- **Phase 3**: 🔄 Multi-token collateral support (USDC, EURC)
- **Phase 4**: 🔄 On-chain credit scoring and decentralized reputation badges

## 📜 License

MIT License
