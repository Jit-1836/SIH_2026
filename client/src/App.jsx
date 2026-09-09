import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Smartphone, Monitor, Radio, Wifi, 
  WifiOff, Lock, LogOut, ShieldCheck, UserCheck 
} from 'lucide-react';
import VictimPortal from './components/VictimPortal';
import GovDashboard from './components/GovDashboard';
import GovAuthModal from './components/GovAuthModal';
import { socket } from './services/socket';

export default function App() {
  const [viewMode, setViewMode] = useState('victim'); // 'victim' | 'gov'
  const [isConnected, setIsConnected] = useState(socket.connected);
  
  // Government Authentication State
  const [govOfficer, setGovOfficer] = useState(() => {
    const saved = sessionStorage.getItem('gov_officer');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const handleSwitchView = (mode) => {
    if (mode === 'gov') {
      if (!govOfficer) {
        // Enforce Government Authentication
        setShowAuthModal(true);
      } else {
        setViewMode('gov');
      }
    } else {
      setViewMode('victim');
    }
  };

  const handleAuthenticate = (officerData) => {
    setGovOfficer(officerData);
    sessionStorage.setItem('gov_officer', JSON.stringify(officerData));
    setShowAuthModal(false);
    setViewMode('gov');
  };

  const handleLogoutGov = () => {
    setGovOfficer(null);
    sessionStorage.removeItem('gov_officer');
    setViewMode('victim');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Universal Header Navbar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/20">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                RESCUENET <span className="text-red-500 font-extrabold text-xs px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30">SIH 2026</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Offline-Resilient Disaster Suite (Problem SIH26206)
              </p>
            </div>
          </div>

          {/* View Mode Controls with Security Gate */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSwitchView('victim')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'victim'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Victim Portal</span>
            </button>

            <button
              onClick={() => handleSwitchView('gov')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'gov'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Gov Command</span>
              {!govOfficer && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
            </button>
          </div>

          {/* Authenticated Officer Badge & Network Indicator */}
          <div className="hidden md:flex items-center space-x-3">
            {govOfficer && viewMode === 'gov' && (
              <div className="flex items-center space-x-2 bg-indigo-950/80 border border-indigo-500/40 px-3 py-1 rounded-xl text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-indigo-200 font-mono">{govOfficer.officer_id}</span>
                <button
                  onClick={handleLogoutGov}
                  title="Lock Government Command Center"
                  className="ml-1 text-slate-400 hover:text-red-400 p-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {isConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isConnected ? 'LOCAL WI-FI ONLINE' : 'OFFLINE QUEUE'}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main View Display */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {viewMode === 'victim' ? (
          <VictimPortal isConnected={isConnected} />
        ) : (
          <GovDashboard isConnected={isConnected} officer={govOfficer} />
        )}
      </main>

      {/* Government Authentication Security Modal */}
      {showAuthModal && (
        <GovAuthModal
          onAuthenticate={handleAuthenticate}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-[11px] py-3 text-center">
        <p>Smart India Hackathon 2026 | Disaster Management & Emergency Off-Grid Suite | Node.js + Socket.io + React + Leaflet</p>
      </footer>
    </div>
  );
}
