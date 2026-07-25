import { useState } from 'react';
import { ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
import type { SimState } from '@/sim/types';

const KIND_COLORS: Record<string, string> = {
  fetch: 'text-sky-300', decode: 'text-cyan-300', execute: 'text-emerald-300',
  memRead: 'text-teal-300', memWrite: 'text-teal-300', cacheAccess: 'text-green-300',
  interrupt: 'text-rose-300', dma: 'text-pink-300', syscall: 'text-cyan-300',
  packet: 'text-green-400', disk: 'text-amber-300', clock: 'text-yellow-300',
  schedule: 'text-sky-300', gpuRender: 'text-indigo-300', mouseEvent: 'text-orange-300',
  control: 'text-indigo-300',
};

export function LogPanel({ sim }: { sim: SimState }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute right-4 top-20 z-30 w-72 rounded-xl bg-slate-950/85 backdrop-blur border border-slate-700/60 shadow-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono tracking-wider text-slate-300 hover:bg-slate-800/40 transition"
      >
        <span className="flex items-center gap-2">
          <ScrollText size={13} className="text-sky-400" />
          EVENT LOG
        </span>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
      {open && (
        <div className="max-h-[36vh] overflow-y-auto px-3 py-2 space-y-1 text-[11px] font-mono border-t border-slate-700/50">
          {sim.log.length === 0 && <div className="text-slate-500 italic">Waiting for events…</div>}
          {sim.log.map(l => (
            <div key={l.id} className="flex gap-2">
              <span className="text-slate-600 shrink-0">[{l.t.toString().padStart(4, '0')}]</span>
              <span className={KIND_COLORS[l.kind] || 'text-slate-300'}>{l.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StatsBar({ sim }: { sim: SimState }) {
  const totalHits = sim.caches.l1.hits + sim.caches.l2.hits + sim.caches.l3.hits;
  const totalMiss = sim.caches.l1.misses + sim.caches.l2.misses + sim.caches.l3.misses;
  const hitRate = totalHits + totalMiss > 0 ? ((totalHits / (totalHits + totalMiss)) * 100).toFixed(0) : '—';
  return (
    <div className="absolute top-4 right-4 z-30 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur border border-slate-700/60 text-[11px] font-mono">
      <span className="text-slate-400">CYCLE</span>
      <span className="text-sky-300">{sim.cycle}</span>
      <span className="text-slate-700">|</span>
      <span className="text-slate-400">PC</span>
      <span className="text-indigo-300">{sim.pc}</span>
      <span className="text-slate-700">|</span>
      <span className="text-slate-400">HIT</span>
      <span className="text-emerald-300">{hitRate}%</span>
      <span className="text-slate-700">|</span>
      <span className="text-slate-400">PROC</span>
      <span className="text-cyan-300">{sim.processes.filter(p => p.state !== 'terminated').length}</span>
    </div>
  );
}
