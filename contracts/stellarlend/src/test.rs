#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _, Ledger as _};
use soroban_sdk::{Address, Env};

#[test]
fn test_create_and_accept_p2p_loan() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellarP2PLending, ());
    let client = StellarP2PLendingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let lender = Address::generate(&env);
    let borrower = Address::generate(&env);

    client.initialize(&admin);

    // 1. Lender creates a 1000 XLM (in stroops) loan offer at 5% APR for 100 ledgers
    let loan_id = client.create_offer(&lender, &1000, &500, &100);
    assert_eq!(loan_id, 1);

    let loan = client.get_loan(&loan_id);
    assert_eq!(loan.amount, 1000);
    assert_eq!(loan.interest_bps, 500);
    assert_eq!(loan.state, LoanState::Active);

    // Check user loans for lender
    let lender_loans = client.get_user_loans(&lender);
    assert_eq!(lender_loans.len(), 1);
    assert_eq!(lender_loans.get(0).unwrap(), 1);

    // 2. Borrower accepts the loan
    client.accept_loan(&borrower, &loan_id);
    let funded_loan = client.get_loan(&loan_id);
    assert_eq!(funded_loan.state, LoanState::Funded);
    assert_eq!(funded_loan.borrower, Some(borrower.clone()));

    // Check user loans for borrower
    let borrower_loans = client.get_user_loans(&borrower);
    assert_eq!(borrower_loans.len(), 1);
    assert_eq!(borrower_loans.get(0).unwrap(), 1);

    // 3. Borrower repays with interest (1000 + 5% = 1050)
    let total_repaid = client.repay_loan(&borrower, &loan_id);
    assert_eq!(total_repaid, 1050);

    let repaid_loan = client.get_loan(&loan_id);
    assert_eq!(repaid_loan.state, LoanState::Repaid);
}

#[test]
fn test_initialize_and_counts() {
    let env = Env::default();
    let contract_id = env.register(StellarP2PLending, ());
    let client = StellarP2PLendingClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.initialize(&admin);
    assert_eq!(client.get_loan_count(), 0);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_cannot_reinitialize() {
    let env = Env::default();
    let contract_id = env.register(StellarP2PLending, ());
    let client = StellarP2PLendingClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.initialize(&admin);
    client.initialize(&admin);
}

#[test]
#[should_panic(expected = "loan is not active for borrowing")]
fn test_cannot_accept_inactive_loan() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellarP2PLending, ());
    let client = StellarP2PLendingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let lender = Address::generate(&env);
    let borrower1 = Address::generate(&env);
    let borrower2 = Address::generate(&env);

    client.initialize(&admin);
    let loan_id = client.create_offer(&lender, &500, &400, &50);

    // First borrower accepts
    client.accept_loan(&borrower1, &loan_id);

    // Second borrower tries to accept the already funded loan -> should panic
    client.accept_loan(&borrower2, &loan_id);
}

#[test]
#[should_panic(expected = "lender cannot borrow own loan")]
fn test_lender_cannot_borrow_own_loan() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellarP2PLending, ());
    let client = StellarP2PLendingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let lender = Address::generate(&env);

    client.initialize(&admin);
    let loan_id = client.create_offer(&lender, &1000, &500, &100);

    client.accept_loan(&lender, &loan_id);
}

#[test]
fn test_claim_default_after_maturity() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellarP2PLending, ());
    let client = StellarP2PLendingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let lender = Address::generate(&env);
    let borrower = Address::generate(&env);

    client.initialize(&admin);
    let loan_id = client.create_offer(&lender, &2000, &1000, &50); // 50 ledgers duration

    client.accept_loan(&borrower, &loan_id);

    // Advance ledger sequence past maturity
    env.ledger().set_sequence_number(100);

    client.claim_default(&lender, &loan_id);

    let defaulted_loan = client.get_loan(&loan_id);
    assert_eq!(defaulted_loan.state, LoanState::Defaulted);
}

#[test]
#[should_panic(expected = "loan has not matured yet")]
fn test_cannot_claim_default_before_maturity() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellarP2PLending, ());
    let client = StellarP2PLendingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let lender = Address::generate(&env);
    let borrower = Address::generate(&env);

    client.initialize(&admin);
    let loan_id = client.create_offer(&lender, &2000, &1000, &100);

    client.accept_loan(&borrower, &loan_id);

    // Try claiming default immediately without advancing ledgers
    client.claim_default(&lender, &loan_id);
}
