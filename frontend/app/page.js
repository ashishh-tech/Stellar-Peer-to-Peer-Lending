'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { isConnected, getAddress } from '@stellar/freighter-api';

// Disable Server-Side Rendering (SSR) for Web3 components
const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });
const Landing = dynamic(() => import('@/components/Landing'), { ssr: false });

export default function Home() {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('marketplace');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connResult = await isConnected();
        const connected = connResult?.isConnected ?? connResult;
        if (connected) {
          const addrResult = await getAddress();
          const addr = addrResult?.address ?? addrResult;
          if (addr && typeof addr === 'string') {
            setAddress(addr);
          }
        }
      } catch (e) {
        // ignore errors
      } finally {
        setLoading(false);
      }
    };
    checkConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-400 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Connecting to Stellar P2P Protocol...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative">
      <Navbar 
        address={address} 
        onConnect={(addr) => setAddress(addr)} 
        onDisconnect={() => setAddress(null)} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {address ? (
        <Dashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      ) : (
        <Landing onConnect={(addr) => setAddress(addr)} />
      )}
    </div>
  );
}
