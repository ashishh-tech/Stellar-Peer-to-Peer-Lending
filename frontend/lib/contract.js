/**
 * Stellar P2P Lending Protocol — Soroban Contract Integration
 *
 * Direct integration layer between the Next.js frontend and the
 * Stellar P2P Lending Soroban smart contract.
 */

import * as StellarSdk from "stellar-sdk";
import {
  isConnected,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";
import {
  CONTRACT_ID as ENV_CONTRACT_ID,
  SERVER_URL as ENV_SERVER_URL,
  HORIZON_URL as ENV_HORIZON_URL,
  NETWORK_PASSPHRASE as ENV_NETWORK_PASSPHRASE,
} from "./stellar.config";

const CONTRACT_ID =
  ENV_CONTRACT_ID || "CDSYUIDUTWYYPT37MH274AGVGVUR6H3IVUQGWUWYX6A6B3U55I37TJKJ";

const SERVER_URL =
  ENV_SERVER_URL || "https://soroban-testnet.stellar.org";

const HORIZON_URL =
  ENV_HORIZON_URL || "https://horizon-testnet.stellar.org";

const NETWORK_PASSPHRASE =
  ENV_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

function getServer() {
  return new StellarSdk.SorobanRpc.Server(SERVER_URL);
}

function getContract() {
  return new StellarSdk.Contract(CONTRACT_ID);
}

function amountToScVal(xlmAmount) {
  return StellarSdk.nativeToScVal(
    BigInt(Math.round(parseFloat(xlmAmount) * 1e7)),
    { type: "i128" }
  );
}

async function requireWallet() {
  const connResult = await isConnected();
  if (!(connResult?.isConnected ?? connResult)) {
    throw new Error("Freighter wallet is not installed or not connected.");
  }
  const addrResult = await getAddress();
  const address = addrResult?.address ?? addrResult;
  if (!address || typeof address !== "string") {
    throw new Error("Could not retrieve wallet address. Please reconnect Freighter.");
  }
  return address;
}

async function fetchAccount(address) {
  const res = await fetch(`${HORIZON_URL}/accounts/${address}`);
  if (!res.ok) {
    throw new Error("Failed to fetch account from Horizon. Ensure your testnet account is funded.");
  }
  const data = await res.json();
  return new StellarSdk.Account(address, data.sequence);
}

async function callMutatingFunction(userAddress, fnName, args) {
  const server = getServer();
  const contract = getContract();
  const sourceAccount = await fetchAccount(userAddress);

  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(fnName, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (StellarSdk.SorobanRpc.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const preparedTx = StellarSdk.SorobanRpc.assembleTransaction(tx, simResult).build();
  const xdr = preparedTx.toXDR();

  const signedXdr = await signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    network: "TESTNET",
  });

  if (!signedXdr) {
    throw new Error("Transaction signing was cancelled by user.");
  }

  const transaction = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE
  );

  let sendResult = await server.sendTransaction(transaction);
  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction submission error: ${JSON.stringify(sendResult.errorResult)}`);
  }

  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const txStatus = await server.getTransaction(sendResult.hash);
    if (txStatus.status === "SUCCESS") {
      return { success: true, hash: sendResult.hash };
    } else if (txStatus.status === "FAILED") {
      throw new Error(`Transaction execution failed on-chain.`);
    }
  }

  return { success: true, hash: sendResult.hash, pending: true };
}

// ── Exported P2P Protocol Functions ──────────────────────────────────────────

/**
 * Lender creates a new P2P loan offer
 * @param {string} userAddress - Lender address
 * @param {number|string} amountXlm - Loan amount in XLM
 * @param {number} interestBps - Interest rate in bps (500 = 5%)
 * @param {number} durationDays - Loan duration in days
 */
export async function createLoanOffer(userAddress, amountXlm, interestBps, durationDays = 30) {
  const address = userAddress || (await requireWallet());
  const amountScVal = amountToScVal(amountXlm);
  const interestScVal = StellarSdk.nativeToScVal(parseInt(interestBps, 10), { type: "u32" });
  // Convert days to approx ledgers (5 seconds per ledger -> 17280 ledgers per day)
  const durationLedgers = parseInt(durationDays, 10) * 17280;
  const durationScVal = StellarSdk.nativeToScVal(durationLedgers, { type: "u32" });
  const lenderScVal = new StellarSdk.Address(address).toScVal();

  return callMutatingFunction(address, "create_offer", [
    lenderScVal,
    amountScVal,
    interestScVal,
    durationScVal,
  ]);
}

/**
 * Borrower accepts and takes a P2P loan
 * @param {string} userAddress - Borrower address
 * @param {number} loanId - Loan ID
 */
export async function acceptLoan(userAddress, loanId) {
  const address = userAddress || (await requireWallet());
  const borrowerScVal = new StellarSdk.Address(address).toScVal();
  const loanIdScVal = StellarSdk.nativeToScVal(BigInt(loanId), { type: "u64" });

  return callMutatingFunction(address, "accept_loan", [
    borrowerScVal,
    loanIdScVal,
  ]);
}

/**
 * Borrower repays the loan with agreed interest
 * @param {string} userAddress - Borrower address
 * @param {number} loanId - Loan ID
 */
export async function repayLoan(userAddress, loanId) {
  const address = userAddress || (await requireWallet());
  const borrowerScVal = new StellarSdk.Address(address).toScVal();
  const loanIdScVal = StellarSdk.nativeToScVal(BigInt(loanId), { type: "u64" });

  return callMutatingFunction(address, "repay_loan", [
    borrowerScVal,
    loanIdScVal,
  ]);
}

/**
 * Query a specific loan details (Read-only simulation)
 */
export async function getLoan(loanId) {
  try {
    const server = getServer();
    const contract = getContract();
    const loanIdScVal = StellarSdk.nativeToScVal(BigInt(loanId), { type: "u64" });

    // Dummy account for read-only simulation
    const dummyAccount = new StellarSdk.Account(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      "0"
    );

    const tx = new StellarSdk.TransactionBuilder(dummyAccount, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_loan", loanIdScVal))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (!StellarSdk.SorobanRpc.isSimulationError(sim) && sim.result) {
      const val = sim.result.retval;
      const parsed = StellarSdk.scValToNative(val);
      return {
        id: Number(parsed.id),
        lender: parsed.lender,
        borrower: parsed.borrower || null,
        amount: Number(parsed.amount) / 1e7,
        interestBps: Number(parsed.interest_bps),
        durationLedgers: Number(parsed.duration_ledgers),
        startLedger: Number(parsed.start_ledger),
        state: Number(parsed.state), // 0: Active, 1: Funded, 2: Repaid, 3: Defaulted
      };
    }
  } catch (err) {
    console.warn(`Could not fetch loan #${loanId}:`, err);
  }
  return null;
}
