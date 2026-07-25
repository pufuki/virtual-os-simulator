import { Keyboard, HardDrive, FileWarning, Zap, Database, Cpu, XCircle, Wifi, Activity, Mouse, Terminal, ArrowRightLeft, Monitor, Clock } from 'lucide-react';

import { sound } from '@/sim/audio';

interface Props {
  onKeyboard: () => void;
  onDisk: () => void;
  onPageFault: () => void;
  onCacheMiss: () => void;
  onDMA: () => void;
  onSpawn: () => void;
  onKill: () => void;
  onPacket: () => void;
  onMouseClick: () => void;
  onSyscall: () => void;
  onContextSwitch: () => void;
  onGpuRender: () => void;
  onTimerInterrupt: () => void;
}

const ACTIONS = [
  { icon: Keyboard, label: 'Keyboard IRQ', color: 'text-rose-300', onClick: 'onKeyboard' as const },
  { icon: HardDrive, label: 'Disk IRQ', color: 'text-amber-300', onClick: 'onDisk' as const },
  { icon: FileWarning, label: 'Page Fault', color: 'text-teal-300', onClick: 'onPageFault' as const },
  { icon: Zap, label: 'Cache Miss', color: 'text-emerald-300', onClick: 'onCacheMiss' as const },
  { icon: Database, label: 'DMA Transfer', color: 'text-pink-300', onClick: 'onDMA' as const },
  { icon: Cpu, label: 'Spawn Process', color: 'text-sky-300', onClick: 'onSpawn' as const },
  { icon: XCircle, label: 'Kill Process', color: 'text-red-300', onClick: 'onKill' as const },
  { icon: Wifi, label: 'Send Packet', color: 'text-green-300', onClick: 'onPacket' as const },
  { icon: Mouse, label: 'Mouse Click', color: 'text-orange-300', onClick: 'onMouseClick' as const },
  { icon: Terminal, label: 'System Call', color: 'text-cyan-300', onClick: 'onSyscall' as const },
  { icon: ArrowRightLeft, label: 'Ctx Switch', color: 'text-teal-200', onClick: 'onContextSwitch' as const },
  { icon: Monitor, label: 'GPU Render', color: 'text-indigo-300', onClick: 'onGpuRender' as const },
  { icon: Clock, label: 'Timer IRQ', color: 'text-amber-200', onClick: 'onTimerInterrupt' as const },
];

export function InteractionPanel({
  onKeyboard, onDisk, onPageFault, onCacheMiss, onDMA, onSpawn, onKill, onPacket,
  onMouseClick, onSyscall, onContextSwitch, onGpuRender, onTimerInterrupt,
}: Props) {
  const handlers: Record<string, () => void> = {
    onKeyboard, onDisk, onPageFault, onCacheMiss, onDMA, onSpawn, onKill, onPacket,
    onMouseClick, onSyscall, onContextSwitch, onGpuRender, onTimerInterrupt,
  };
  return (
    <div className="absolute left-4 top-20 z-30 w-52 p-3 rounded-xl bg-slate-950/85 backdrop-blur border border-slate-700/60 shadow-2xl">
      <div className="flex items-center gap-2 mb-2 text-slate-300 text-xs font-mono tracking-wider">
        <Activity size={13} className="text-sky-400" />
        INJECT EVENTS
      </div>
      <div className="grid grid-cols-2 gap-1.5 max-h-[60vh] overflow-y-auto pr-0.5">
        {ACTIONS.map(a => (
          <button key={a.label} onClick={() => { sound.playEventInject(); handlers[a.onClick](); }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/70 text-[11px] text-slate-200 transition group">
            <a.icon size={13} className={a.color} />
            <span className="truncate">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
