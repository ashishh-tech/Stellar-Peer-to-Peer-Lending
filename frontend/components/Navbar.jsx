'use client';

import { useState } from 'react';
import { connectWallet } from '@/lib/freighter';

export default function Navbar({ address, onConnect, onDisconnect, activeTab, setActiveTab }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    const userAddress = await connectWallet();
    if (userAddress && onConnect) onConnect(userAddress);
    setLoading(false);
  };

  const truncateAddress = (addr) => {
    if (!addr || typeof addr !== 'string') return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 py-3.5 bg-slate-950/70 backdrop-blur-2xl border-b border-emerald-500/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-all">
      <div className="container mx-auto flex justify-between items-center w-full">
        {/* Brand */}
        <div className="flex items-center gap-6 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <span className="material-symbols-outlined text-slate-950 text-[22px] font-bold">handshake</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white font-headline">Stellar<span className="text-emerald-400">P2P</span></span>
                <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/30">Direct Escrow</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Decentralized Peer-to-Peer Protocol</span>
            </div>
          </div>

          {/* Navigation Links when connected */}
          {address && setActiveTab && (
            <div className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'marketplace'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Marketplace
              </button>
              <button
                onClick={() => setActiveTab('my-positions')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'my-positions'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                My Loans & Escrow
              </button>
            </div>
          )}
        </div>

        {/* Wallet connection */}
        <div>
          {address ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-emerald-500/30 text-xs md:text-sm font-mono text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {truncateAddress(address)}
              </div>
              <button
                onClick={onDisconnect}
                title="Disconnect wallet"
                className="text-slate-400 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-rose-500/10"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-102"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              {loading ? 'Connecting...' : 'Connect Freighter'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
