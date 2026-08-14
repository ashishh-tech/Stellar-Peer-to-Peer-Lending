#![no_std]
#![allow(deprecated)]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Vec};

mod test;

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum LoanState {
    Active = 0,    // Open for borrower to accept
    Funded = 1,    // Accepted by borrower, repayment pending
    Repaid = 2,    // Fully repaid to lender with interest
    Defaulted = 3, // Past maturity date without full repayment
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct LoanOffer {
    pub id: u64,
    pub lender: Address,
    pub borrower: Option<Address>,
    pub amount: i128,              // Principal in stroops
    pub interest_bps: u32,         // Basis points (e.g. 500 = 5.00%)
    pub duration_ledgers: u32,     // Duration in Stellar ledgers
    pub start_ledger: u32,         // Ledger when funded
    pub state: LoanState,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    LoanCount,
    Loan(u64),
    UserLoans(Address), // List of loan IDs created or borrowed by user
}

#[contract]
pub struct StellarP2PLending;

#[contractimpl]
impl StellarP2PLending {
    /// Initialize the contract with an admin address
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::LoanCount, &0u64);
    }

    /// Lenders create a custom P2P loan offer with defined amount, APR (basis points), and duration
    pub fn create_offer(
        env: Env,
        lender: Address,
        amount: i128,
        interest_bps: u32,
        duration_ledgers: u32,
    ) -> u64 {
        lender.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        if duration_ledgers == 0 {
            panic!("duration must be greater than zero");
        }

        let mut count: u64 = env.storage().instance().get(&DataKey::LoanCount).unwrap_or(0);
        count += 1;

        let offer = LoanOffer {
            id: count,
            lender: lender.clone(),
            borrower: None,
            amount,
            interest_bps,
            duration_ledgers,
            start_ledger: 0,
            state: LoanState::Active,
        };

        env.storage().persistent().set(&DataKey::Loan(count), &offer);
        env.storage().instance().set(&DataKey::LoanCount, &count);

        // Add to lender's loan tracking
        let mut lender_loans: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::UserLoans(lender.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        lender_loans.push_back(count);
        env.storage().persistent().set(&DataKey::UserLoans(lender.clone()), &lender_loans);

        env.events().publish((symbol_short!("cr_offer"), lender), (count, amount));
        count
    }

    /// Borrowers accept and fund a specific P2P loan offer
    pub fn accept_loan(env: Env, borrower: Address, loan_id: u64) {
        borrower.require_auth();

        let mut loan: LoanOffer = env
            .storage()
            .persistent()
            .get(&DataKey::Loan(loan_id))
            .unwrap_or_else(|| panic!("loan offer not found"));

        if loan.state != LoanState::Active {
            panic!("loan is not active for borrowing");
        }
        if loan.lender == borrower {
            panic!("lender cannot borrow own loan");
        }

        loan.borrower = Some(borrower.clone());
        loan.state = LoanState::Funded;
        loan.start_ledger = env.ledger().sequence();

        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);

        // Add to borrower's loan tracking
        let mut borrower_loans: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::UserLoans(borrower.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        borrower_loans.push_back(loan_id);
        env.storage().persistent().set(&DataKey::UserLoans(borrower.clone()), &borrower_loans);

        env.events().publish((symbol_short!("ac_loan"), borrower), (loan_id, loan.amount));
    }

    /// Borrowers repay the loan principal + interest
    pub fn repay_loan(env: Env, borrower: Address, loan_id: u64) -> i128 {
        borrower.require_auth();

        let mut loan: LoanOffer = env
            .storage()
            .persistent()
            .get(&DataKey::Loan(loan_id))
            .unwrap_or_else(|| panic!("loan not found"));

        if loan.state != LoanState::Funded {
            panic!("loan is not in funded state");
        }

        if let Some(ref assigned_borrower) = loan.borrower {
            if assigned_borrower != &borrower {
                panic!("unauthorized borrower");
            }
        } else {
            panic!("loan has no borrower");
        }

        // Calculate total repay amount: Principal + (Principal * interest_bps / 10000)
        let interest = (loan.amount * (loan.interest_bps as i128)) / 10000;
        let total_repay = loan.amount + interest;

        loan.state = LoanState::Repaid;
        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);

        env.events().publish((symbol_short!("rp_loan"), borrower), (loan_id, total_repay));
        total_repay
    }

    /// Lenders claim default if maturity duration has passed without repayment
    pub fn claim_default(env: Env, lender: Address, loan_id: u64) {
        lender.require_auth();

        let mut loan: LoanOffer = env
            .storage()
            .persistent()
            .get(&DataKey::Loan(loan_id))
            .unwrap_or_else(|| panic!("loan not found"));

        if loan.lender != lender {
            panic!("only lender can claim default");
        }
        if loan.state != LoanState::Funded {
            panic!("loan not eligible for default");
        }

        let current_ledger = env.ledger().sequence();
        if current_ledger < loan.start_ledger + loan.duration_ledgers {
            panic!("loan has not matured yet");
        }

        loan.state = LoanState::Defaulted;
        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);

        env.events().publish((symbol_short!("def_loan"), lender), loan_id);
    }

    /// Query specific loan details
    pub fn get_loan(env: Env, loan_id: u64) -> LoanOffer {
        env.storage()
            .persistent()
            .get(&DataKey::Loan(loan_id))
            .unwrap_or_else(|| panic!("loan not found"))
    }

    /// Query total number of loans created
    pub fn get_loan_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::LoanCount).unwrap_or(0)
    }

    /// Get all loan IDs associated with an address
    pub fn get_user_loans(env: Env, user: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::UserLoans(user))
            .unwrap_or_else(|| Vec::new(&env))
    }
}
