# 🛠️ Operations & Monitoring Runbook

This runbook outlines operational procedures, health checks, RPC monitoring, and event monitoring for **StellarP2P**.

---

## 1. Network & RPC Endpoints

| Service | Testnet URL |
| :--- | :--- |
| **Soroban RPC** | `https://soroban-testnet.stellar.org` |
| **Horizon API** | `https://horizon-testnet.stellar.org` |
| **Contract ID** | `CDSYUIDUTWYYPT37MH274AGVGVUR6H3IVUQGWUWYX6A6B3U55I37TJKJ` |
| **Explorer** | [Stellar Expert Explorer](https://stellar.expert/explorer/testnet/contract/CDSYUIDUTWYYPT37MH274AGVGVUR6H3IVUQGWUWYX6A6B3U55I37TJKJ) |

---

## 2. Health Check Commands

### Testnet RPC Health
```bash
curl -X POST https://soroban-testnet.stellar.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```
**Expected Response:** `{"jsonrpc":"2.0","result":{"status":"healthy"},"id":1}`

### Latest Ledger Sequence Check
```bash
curl -s https://horizon-testnet.stellar.org/fee_stats | grep -o '"last_ledger":[^,]*'
```

---

## 3. Contract Event Monitoring

The smart contract emits structured events for all key actions:

| Event Symbol | Topics | Data Payload |
| :--- | :--- | :--- |
| `cr_offer` | `("cr_offer", lender_address)` | `(loan_id, amount)` |
| `ac_loan` | `("ac_loan", borrower_address)` | `(loan_id, amount)` |
| `rp_loan` | `("rp_loan", borrower_address)` | `(loan_id, total_repay)` |
| `def_loan` | `("def_loan", lender_address)` | `loan_id` |

### Querying Events via RPC
```bash
curl -X POST https://soroban-testnet.stellar.org \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getEvents",
    "params": {
      "startLedger": 1000,
      "filters": [{
        "type": "contract",
        "contractIds": ["CDSYUIDUTWYYPT37MH274AGVGVUR6H3IVUQGWUWYX6A6B3U55I37TJKJ"]
      }]
    }
  }'
```

---

## 4. Incident Response & Troubleshooting

1. **Transaction Simulation Fails**:
   - Check if the loan is already in `Funded` or `Repaid` state.
   - Verify that the borrower has sufficient XLM balance for gas and principal/interest.
2. **Freighter Wallet Not Detected**:
   - Ensure the Freighter extension is unlocked and set to **Testnet**.
3. **RPC Timeout / Congestion**:
   - Fall back to secondary public Soroban RPC nodes or retry with exponential backoff.
