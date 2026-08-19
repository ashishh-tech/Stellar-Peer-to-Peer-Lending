# 🎤 Demo Day Presentation Guide & Script

This guide outlines the pitch deck breakdown and live presentation script for **StellarP2P**.

---

## 1. Slide Deck Overview (`StellarLend_Pitch_Deck.pptx`)

- **Slide 1: Title & Vision** — StellarP2P: Trustless Peer-to-Peer Lending on Stellar.
- **Slide 2: Problem Statement** — Centralized banking spreads are predatory; existing DeFi pools suffer from liquidity pooling inefficiencies, fluctuating unpredictable rates, and high gas fees.
- **Slide 3: Our Solution** — Bilateral custom peer-to-peer loan agreements secured by Soroban smart contracts with fixed APR and sub-second settlement.
- **Slide 4: Key Features & Architecture** — Non-custodial escrow, custom duration/APR parameters, instant Freighter wallet integration, deterministic interest calculation.
- **Slide 5: Live Traction & Feedback** — 4.8/5 user satisfaction rating, 200+ repo clones, verified Testnet contract with active transactions.
- **Slide 6: Roadmap & Next Steps** — Multi-currency collateral (USDC/EURC), decentralized credit reputation scores.

---

## 2. Live 2-Minute Demo Day Script

> **[0:00 - 0:30] Hook & Intro**
> "Hello everyone! Traditional DeFi lending pools force lenders and borrowers into algorithmic interest rates that fluctuate unpredictably. Today, we're excited to introduce **StellarP2P** — a decentralized, peer-to-peer lending marketplace built natively on Stellar using Soroban smart contracts."

> **[0:30 - 1:15] Live Product Demonstration**
> "Here on our live dApp, a lender connects their Freighter wallet and publishes a loan offer with their chosen terms: 500 XLM at 5% APR for 100 ledgers. Notice how fast this executes thanks to Stellar's 5-second ledger finality.
>
> Now switching to the borrower view: the borrower sees the open marketplace, selects the loan, and accepts it. The Soroban contract locks the terms into escrow, tracks the exact ledger sequence, and calculates total repayment with interest deterministically down to the stroop."

> **[1:15 - 1:45] Repayment & Security**
> "When the borrower repays, the contract settles principal plus interest back to the lender, closing the position cleanly. If maturity passes without repayment, the lender can trigger an on-chain default claim. Our contract code is verified with a comprehensive 7-test suite and verified on the Stellar Testnet."

> **[1:45 - 2:00] Conclusion**
> "With sub-cent fees, fast finality, and 4.8/5 beta user satisfaction, StellarP2P makes micro-lending accessible to anyone in the world. Thank you!"
