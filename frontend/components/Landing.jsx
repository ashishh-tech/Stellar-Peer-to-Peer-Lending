'use client';

import { connectWallet } from '@/lib/freighter';

export default function Landing({ onConnect }) {
  const handleConnect = async () => {
    const address = await connectWallet();
    if (address && onConnect) {
      onConnect(address);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 md:px-6 relative z-10 pt-28 md:pt-36 pb-16">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs md:text-sm tracking-wide uppercase shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Stellar Soroban Peer-to-Peer Protocol
        </div>
        
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-slate-400 mb-6 font-headline leading-tight max-w-4xl drop-shadow-sm">
          Decentralized <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Peer-to-Peer Lending</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-10 max-w-2xl font-body leading-relaxed">
          Create tailored loan terms, lend directly to peers, and borrow without pooled intermediaries. Built with transparent, trustless Soroban escrow contracts.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleConnect}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-2xl font-bold font-headline text-base md:text-lg transition-all hover:scale-105 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
          >
            <span>Launch P2P Marketplace</span>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-5xl">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-7 text-left hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[24px] text-emerald-400">tune</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-headline">Custom Loan Terms</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Lenders set exact principal amounts, customized interest rates (APR), and repayment schedules.
            </p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-7 text-left hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[24px] text-teal-400">lock_open</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-headline">Trustless On-Chain Escrow</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              All loan agreements and disbursements are locked in automated Soroban smart contract instances.
            </p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-7 text-left hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[24px] text-cyan-400">speed</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-headline">Sub-Second Stellar Settlement</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enjoy 5-second ledger finality and fractions-of-a-cent fees on the Stellar Testnet & Mainnet.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-slate-500 text-xs font-mono relative z-10">
        © 2026 StellarP2P Protocol. Built with Soroban Smart Contracts.
      </footer>
    </div>
  );
}
