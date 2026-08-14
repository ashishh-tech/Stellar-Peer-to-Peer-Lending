'use client';

import { useState } from 'react';
import { createLoanOffer } from '@/lib/contract';

export default function CreateOfferModal({ isOpen, onClose, userAddress, onOfferCreated }) {
  const [amount, setAmount] = useState('');
  const [interestApy, setInterestApy] = useState('5.0');
  const [durationDays, setDurationDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedAmount = parseFloat(amount);
    const parsedApy = parseFloat(interestApy);
    const parsedDuration = parseInt(durationDays, 10);

    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid loan amount.');
      return;
    }
    if (isNaN(parsedApy) || parsedApy < 0) {
      setError('Please enter a valid interest rate (APR %).');
      return;
    }
    if (!parsedDuration || parsedDuration <= 0) {
      setError('Please enter a valid duration.');
      return;
    }

    try {
      setLoading(true);
      // Convert APY % to basis points (e.g. 5.5% = 550 bps)
      const interestBps = Math.round(parsedApy * 100);
      const res = await createLoanOffer(userAddress, parsedAmount, interestBps, parsedDuration);
      
      setSuccess(`Loan Offer created successfully! Tx: ${res.hash.slice(0, 10)}...`);
      setTimeout(() => {
        if (onOfferCreated) onOfferCreated();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit loan offer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(16,185,129,0.15)] relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400 text-[22px]">add_circle</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-headline">Create P2P Loan Offer</h2>
            <p className="text-xs text-slate-400">Offer XLM capital directly to borrowers on your terms</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Loan Principal (XLM)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                placeholder="e.g. 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all font-mono"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 font-mono">
                XLM
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Interest Rate (APR %)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="5.0"
                value={interestApy}
                onChange={(e) => setInterestApy(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Duration (Days)
              </label>
              <input
                type="number"
                placeholder="30"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-2 mt-4">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Estimated Return:</span>
              <span className="text-emerald-400 font-mono font-bold">
                {amount && !isNaN(parseFloat(amount))
                  ? (
                      parseFloat(amount) *
                      (1 + parseFloat(interestApy || 0) / 100)
                    ).toFixed(2) + ' XLM'
                  : '0.00 XLM'}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Settlement Method:</span>
              <span className="text-white font-mono">Automated Soroban Escrow</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl text-sm transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
          >
            {loading ? 'Submitting to Stellar...' : 'Confirm & Publish Offer'}
          </button>
        </form>
      </div>
    </div>
  );
}
