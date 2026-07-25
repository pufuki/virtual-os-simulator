import { useState } from 'react';
import { Pause, Play, SkipForward, RotateCcw, Gauge, ZoomIn, ZoomOut, Home, Volume2, VolumeX } from 'lucide-react';
import type { SimState } from '@/sim/types';
import { sound } from '@/sim/audio';

interface Props {
  sim: SimState;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeed: (s: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

const SPEEDS = [0.10, 0.25, 0.5, 1, 2, 5, 20];

export function Controls({
  sim, onToggleRun, onStep, onReset, onSpeed, onZoomIn, onZoomOut, onResetView,
}: Props) {
  const [soundOn, setSoundOn] = useState(() => sound.isEnabled());

  const toggleSound = () => {
    const next = sound.toggle();
    setSoundOn(next);
    if (next) sound.playComponentClick();
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/85 backdrop-blur border border-slate-700/60 shadow-2xl">
      <button onClick={onToggleRun} title={sim.running ? 'Pause' : 'Play'}
        className="p-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 transition">
        {sim.running ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <button onClick={onStep} title="Step"
        className="p-2 rounded-lg bg-slate-700/40 hover:bg-slate-600/60 text-slate-200 transition">
        <SkipForward size={18} />
      </button>
      <button onClick={onReset} title="Reset"
        className="p-2 rounded-lg bg-slate-700/40 hover:bg-rose-600/40 text-slate-200 hover:text-rose-200 transition">
        <RotateCcw size={18} />
      </button>

      <div className="w-px h-6 bg-slate-700/60 mx-1" />

      <Gauge size={16} className="text-slate-400" />
      <div className="flex items-center gap-1">
        {SPEEDS.map(s => (
          <button key={s} onClick={() => onSpeed(s)}
            className={`px-2 py-1 rounded-md text-xs font-mono transition ${
              sim.speed === s ? 'bg-sky-500/40 text-sky-200' : 'text-slate-400 hover:bg-slate-700/40'
            }`}>
            {s}×
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-slate-700/60 mx-1" />

      <button onClick={onZoomOut} title="Zoom out"
        className="p-2 rounded-lg bg-slate-700/40 hover:bg-slate-600/60 text-slate-200 transition">
        <ZoomOut size={18} />
      </button>
      <button onClick={onResetView} title="Reset view"
        className="p-2 rounded-lg bg-slate-700/40 hover:bg-slate-600/60 text-slate-200 transition">
        <Home size={18} />
      </button>
      <button onClick={onZoomIn} title="Zoom in"
        className="p-2 rounded-lg bg-slate-700/40 hover:bg-slate-600/60 text-slate-200 transition">
        <ZoomIn size={18} />
      </button>

      <div className="w-px h-6 bg-slate-700/60 mx-1" />

      <button onClick={toggleSound} title={soundOn ? 'Mute sound effects' : 'Enable sound effects'}
        className={`p-2 rounded-lg transition ${
          soundOn ? 'bg-sky-500/20 hover:bg-sky-500/40 text-sky-300' : 'bg-slate-700/40 hover:bg-slate-600/60 text-slate-400'
        }`}>
        {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
    </div>
  );
}
