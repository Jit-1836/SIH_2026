import React from 'react';
import { QrCode, ShieldCheck, User, MapPin, Calendar, Utensils } from 'lucide-react';

export default function RationTokenCard({ victim }) {
  if (!victim) return null;

  // Simple offline SVG QR Code pattern generator based on token string
  const renderMockQR = (text) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    
    const size = 11;
    const cells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Corners are finder patterns
        const isCorner = (r < 3 && c < 3) || (r < 3 && c > size - 4) || (r > size - 4 && c < 3);
        const fill = isCorner || Math.abs((hash * (r + 1) + c * 3)) % 2 === 0;
        if (fill) {
          cells.push(
            <rect
              key={`${r}-${c}`}
              x={c * 10}
              y={r * 10}
              width={9}
              height={9}
              fill="#06b6d4"
              rx={1.5}
            />
          );
        }
      }
    }
    return (
      <svg viewBox="0 0 110 110" className="w-24 h-24 bg-slate-950 p-2 rounded-xl border border-cyan-500/40 shadow-inner">
        {cells}
      </svg>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h4 className="font-bold text-slate-100 text-sm tracking-wide uppercase">
            Official Offline Ration Token
          </h4>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
          VALIDATED
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* QR Code */}
        <div className="flex flex-col items-center">
          {renderMockQR(victim.ration_token || victim.id)}
          <span className="font-mono text-[11px] text-cyan-400 font-bold mt-2 bg-slate-900 px-2 py-0.5 rounded border border-cyan-900">
            {victim.ration_token || 'RATION-TOK-99'}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-200">
            <User className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm">{victim.name}</span>
            <span className="text-slate-400">({victim.age} yrs, {victim.gender})</span>
          </div>

          <div className="flex items-center space-x-2 text-slate-300">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>Shelter: <strong className="text-slate-100">{victim.camp_id}</strong> ({victim.origin})</span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Issued: {new Date(victim.registered_at || Date.now()).toLocaleTimeString()}</span>
          </div>

          <div className="pt-2 flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 flex items-center gap-1 font-mono">
              <Utensils className="w-3 h-3 text-amber-400" /> 2x Food Packets
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
              💧 3L Water
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
