'use client';

import { useState, useEffect, useCallback } from 'react';
import CreateOfferModal from './CreateOfferModal';
import { acceptLoan, repayLoan, getLoan } from '@/lib/contract';
import { HORIZON_URL } from '@/lib/stellar.config';

// Mock initial live P2P marketplace offers for instant demonstration
const INITIAL_P2P_OFFERS = [
  {
    id: 101,
    lender: 'GDKX...4KL9',
    amount: 500,
    interestBps: 450, // 4.5%
    durationDays: 14,
    state: 0, // Active
  },
  {
    id: 102,
    lender: 'GA7P...9MW2',
    amount: 1200,
    interestBps: 520, // 5.2%
    durationDays: 30,
    state: 0, // Active
  },
  {
    id: 103,
    lender: 'GC3T...8QP1',
    amount: 250,
    interestBps: 380, // 3.8%
    durationDays: 7,
    state: 0, // Active
  },
];

export default function Dashboard({ activeTab = 'marketplace', setActiveTab }) {
  const [address, setAddress] = useState(null);
  const [xlmBalance, setXlmBalance] = useState(null);
  const [xlmPrice, setXlmPrice] = useState(0.12);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const [offers, setOffers] = useState(INITIAL_P2P_OFFERS);
  const [myFunded, setMyFunded] = useState([]);
  const [myBorrowed, setMyBorrowed] = useState([]);

  // Fetch balance from Horizon
  const fetchWalletInfo = useCallback(async () => {
    try {
      const { isConnected, getAddress } = await import('@stellar/freighter-api');
      const connResult = await isConnected();
      const connected = connResult?.isConnected ?? connResult;
      if (!connected) return;

      const addrResult = await getAddress();
      const userAddress = addrResult?.address ?? addrResult;
      if (!userAddress || typeof userAddress !== 'string') return;

      setAddress(userAddress);

      const horizonRes = await fetch(`${HORIZON_URL}/accounts/${userAddress}`);
      if (horizonRes.ok) {
        const data = await horizonRes.json();
        const xlm = data.balances?.find((b) => b.asset_type === 'native')?.balance;
        if (xlm) setXlmBalance(parseFloat(xlm));
      }
    } catch (e) {
      console.warn('Wallet info fetch:', e);
    }
  }, []);

  useEffect(() => {
    fetchWalletInfo();
    const interval = setInterval(fetchWalletInfo, 10000);
    return () => clearInterval(interval);
  }, [fetchWalletInfo]);

  // Handle Taking a Loan
  const handleTakeLoan = async (offer) => {
    try {
      setActionLoading(offer.id);
      setStatusMessage({ type: 'info', text: `Initiating loan agreement #${offer.id} via Freighter...` });
      
      const res = await acceptLoan(address, offer.id);
      
      // Update UI state
      setOffers((prev) => prev.filter((o) => o.id !== offer.id));
      setMyBorrowed((prev) => [
        ...prev,
        {
          ...offer,
          borrower: address,
          state: 1, // Funded
          repayAmount: offer.amount * (1 + offer.interestBps / 10000),
          dueDate: new Date(Date.now() + offer.durationDays * 86400000).toLocaleDateString(),
        },
      ]);

      setStatusMessage({
        type: 'success',
        text: `Loan #${offer.id} successfully funded! XLM transferred to your wallet.`,
      });
      fetchWalletInfo();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to take loan.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Repaying a Loan
  const handleRepayLoan = async (loan) => {
    try {
      setActionLoading(loan.id);
      setStatusMessage({ type: 'info', text: `Submitting repayment for Loan #${loan.id}...` });

      await repayLoan(address, loan.id);

      setMyBorrowed((prev) =>
        prev.map((l) => (l.id === loan.id ? { ...l, state: 2 } : l))
      );

      setStatusMessage({
        type: 'success',
        text: `Loan #${loan.id} fully repaid! Escrow closed.`,
      });
      fetchWalletInfo();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Repayment failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Total Market Stats
  const totalMarketVolume = offers.reduce((acc, curr) => acc + curr.amount, 0) + 
    myBorrowed.reduce((acc, curr) => acc + curr.amount, 0) + 
    myFunded.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="container mx-auto px-4 md:px-8 pt-24 pb-16 min-h-screen">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <span className="text-slate-400 text-xs font-mono block mb-1">Total P2P Escrow</span>
          <span className="text-2xl font-bold text-white font-headline">
            {totalMarketVolume.toLocaleString()} <span className="text-xs text-emerald-400 font-mono">XLM</span>
          </span>
          <span className="text-[11px] text-slate-500 block mt-1 font-mono">
            ≈ ${(totalMarketVolume * xlmPrice).toFixed(2)} USD
          </span>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <span className="text-slate-400 text-xs font-mono block mb-1">Average Peer APR</span>
          <span className="text-2xl font-bold text-emerald-400 font-headline">4.85%</span>
          <span className="text-[11px] text-slate-500 block mt-1 font-mono">Fixed terms</span>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <span className="text-slate-400 text-xs font-mono block mb-1">Your Wallet Balance</span>
          <span className="text-2xl font-bold text-teal-300 font-headline">
            {xlmBalance !== null ? xlmBalance.toFixed(2) : '---'} <span className="text-xs text-slate-400 font-mono">XLM</span>
          </span>
          <span className="text-[11px] text-emerald-400 block mt-1 font-mono">Stellar Testnet</span>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-mono block mb-1">P2P Actions</span>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            + Create Loan Offer
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs font-mono flex items-center justify-between border ${
            statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-teal-500/10 border-teal-500/30 text-teal-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* View Switcher (Mobile) */}
      <div className="flex md:hidden mb-6 bg-slate-900 p-1 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveTab && setActiveTab('marketplace')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold ${
            activeTab === 'marketplace' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab && setActiveTab('my-positions')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold ${
            activeTab === 'my-positions' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          My Loans ({myBorrowed.length + myFunded.length})
        </button>
      </div>

      {/* Tab 1: P2P Loan Marketplace */}
      {activeTab === 'marketplace' && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white font-headline">Available Peer Loan Offers</h2>
              <p className="text-xs text-slate-400 mt-1">Browse capital offers submitted by peers. Instant escrow settlement upon acceptance.</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold rounded-xl text-xs transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Offer
            </button>
          </div>

          {offers.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-mono text-xs">
              No active offers in marketplace. Click "Create Offer" to publish the first one!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-slate-950/70 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-5 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono bg-slate-900 border border-white/10 px-2.5 py-1 rounded-md text-slate-400">
                        Offer #{offer.id}
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {(offer.interestBps / 100).toFixed(1)}% APR
                      </span>
                    </div>

                    <div className="mb-4">
                      <span className="text-xs text-slate-400 block mb-1">Principal Amount</span>
                      <span className="text-3xl font-black text-white font-headline">
                        {offer.amount}{' '}
                        <span className="text-sm font-mono text-emerald-400">XLM</span>
                      </span>
                    </div>

                    <div className="space-y-2 border-t border-white/5 pt-3 mb-5 text-xs text-slate-400 font-mono">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="text-white">{offer.durationDays} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lender:</span>
                        <span className="text-slate-300">{offer.lender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Repayment:</span>
                        <span className="text-teal-300 font-bold">
                          {(offer.amount * (1 + offer.interestBps / 10000)).toFixed(2)} XLM
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTakeLoan(offer)}
                    disabled={actionLoading === offer.id}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    {actionLoading === offer.id ? 'Borrowing...' : 'Accept & Borrow XLM'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Positions (Funded & Borrowed) */}
      {activeTab === 'my-positions' && (
        <div className="space-y-8">
          {/* Active Borrowings */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-white font-headline mb-2">My Active Borrowings</h2>
            <p className="text-xs text-slate-400 mb-6">Loans you have accepted from peers that require repayment.</p>

            {myBorrowed.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-mono text-xs bg-slate-950/40 rounded-2xl border border-white/5">
                You have no active borrowings. Take a loan from the marketplace.
              </div>
            ) : (
              <div className="space-y-4">
                {myBorrowed.map((loan) => (
                  <div
                    key={loan.id}
                    className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white font-headline">Loan #{loan.id}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            loan.state === 2
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {loan.state === 2 ? 'Repaid' : 'Repayment Due'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        Principal: <strong className="text-white">{loan.amount} XLM</strong> | APR:{' '}
                        <strong className="text-emerald-400">{(loan.interestBps / 100).toFixed(1)}%</strong> | Due:{' '}
                        <strong className="text-slate-300">{loan.dueDate}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-mono block">Repay Amount</span>
                        <span className="text-lg font-bold text-emerald-400 font-mono">
                          {loan.repayAmount.toFixed(2)} XLM
                        </span>
                      </div>
                      {loan.state !== 2 && (
                        <button
                          onClick={() => handleRepayLoan(loan)}
                          disabled={actionLoading === loan.id}
                          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50 shadow-md"
                        >
                          {actionLoading === loan.id ? 'Repaying...' : 'Repay Loan'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Offer Modal */}
      <CreateOfferModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        userAddress={address}
        onOfferCreated={() => {
          fetchWalletInfo();
        }}
      />
    </div>
  );
}
