# 🔒 StellarP2P Security Policy & Verification

This document outlines the security architecture, authorization controls, threat model, and verification procedures for the **StellarP2P** protocol.

---

## 1. Security Architecture & Controls

### 🛡️ Explicit Authorization Verification (`require_auth`)
All state-modifying functions enforce cryptographic signature verification on the invoking address:

```rust
// Only the designated lender can create or claim default on their loan
lender.require_auth();

// Only the borrower can accept or repay their loan
borrower.require_auth();
```

### 🛡️ State Invariant Guarantees
- **No Self-Lending**: Lenders cannot accept their own loan offers (`lender != borrower`).
- **One-Time Initialization**: Contract initialization is protected against re-initialization exploits.
- **Strict State Progression**: Loans cannot be accepted twice or repaid out of order.
- **Deterministic Arithmetic**: Interest calculations use fixed-point basis point arithmetic preventing overflow and precision truncation.

---

## 2. Threat Model & Mitigation Matrix

| Potential Threat | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Unauthorized Loan Acceptance** | High | Contract verifies `borrower.require_auth()` and checks `state == LoanState::Active`. |
| **Premature Default Claims** | High | Contract enforces `current_ledger >= start_ledger + duration_ledgers`. |
| **Front-Running / Double Borrow** | High | Atomic state transition from `Active` to `Funded` on first valid transaction. |
| **Malicious Repayment Manipulation** | Medium | Only `loan.borrower` can repay; calculated amount is deterministic. |
| **Re-entrancy** | Low | Soroban runtime execution model prevents external call re-entrancy during state mutations. |

---

## 3. Automated Test Suite

The smart contract undergoes comprehensive automated unit testing in Rust:

```bash
cargo test
```

### Verified Test Cases:
1. `test_initialize_and_counts`: Verifies storage initialization and starting counters.
2. `test_cannot_reinitialize`: Confirms contract rejects duplicate initialization.
3. `test_create_and_accept_p2p_loan`: Verifies full lifecycle (Create $\rightarrow$ Accept $\rightarrow$ Repay with Interest).
4. `test_cannot_accept_inactive_loan`: Rejects secondary acceptance on funded/repaid loans.
5. `test_lender_cannot_borrow_own_loan`: Prohibits self-dealing.
6. `test_claim_default_after_maturity`: Validates default transition once ledger duration elapses.
7. `test_cannot_claim_default_before_maturity`: Rejects default claims before maturity.
