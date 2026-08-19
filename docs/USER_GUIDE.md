# 📘 StellarP2P User Guide & Onboarding Walkthrough

Welcome to **StellarP2P** — the decentralized Peer-to-Peer lending marketplace on the Stellar blockchain.

---

## 1. Prerequisites

1. Install the **[Freighter Wallet Extension](https://www.freighter.app/)** for Chrome / Firefox / Brave.
2. Switch network in Freighter settings to **Testnet**.
3. Fund your testnet wallet with test XLM using the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=test).

---

## 2. Connecting to StellarP2P

1. Open the live dApp: [https://stellarlendmastery-demo.netlify.app](https://stellarlendmastery-demo.netlify.app)
2. Click **"Connect Wallet"** in the top navigation bar.
3. Approve the Freighter connection prompt.
4. Your current XLM balance and active positions will automatically populate.

---

## 3. Creating a Loan Offer (For Lenders)

1. Navigate to the **"Create Offer"** button in the dashboard or navbar.
2. Fill out the loan terms:
   - **Amount (XLM)**: e.g., `500 XLM`
   - **Interest Rate (APR %)**: e.g., `5.00%`
   - **Duration (Ledgers/Days)**: e.g., `100 ledgers` (~500 seconds on Testnet)
3. Click **"Publish Loan Offer"**.
4. Sign the transaction in the Freighter popup.
5. Once confirmed, your offer will appear in the **P2P Marketplace** orderbook.

---

## 4. Borrowing a Loan (For Borrowers)

1. Browse the **P2P Marketplace** to view active loan offers.
2. Review the terms (Lender address, Principal amount, APR %, Duration).
3. Click **"Borrow"** on your chosen offer.
4. Confirm and sign the transaction with Freighter.
5. The principal is transferred, and the loan moves to your **"Active Borrowings"** dashboard.

---

## 5. Repaying a Loan

1. In your **"Active Borrowings"** section, locate the loan requiring repayment.
2. The UI automatically displays the total amount due (Principal + calculated interest).
3. Click **"Repay Loan"** and sign the transaction.
4. The smart contract validates repayment, closes the loan, and updates the status to **Repaid**.
