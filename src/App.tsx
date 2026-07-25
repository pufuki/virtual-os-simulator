import { useCallback, useEffect, useRef, useState } from 'react';
import { Motherboard } from '@/components/Motherboard';
import { SignalOverlay } from '@/components/SignalOverlay';
import { Controls } from '@/components/Controls';
import { InteractionPanel } from '@/components/InteractionPanel';
import { LogPanel, StatsBar } from '@/components/LogPanel';
import { DetailView } from '@/components/DetailView';
import { useCamera } from '@/components/camera';
import { COMPONENT_MAP, PATH_MAP } from '@/sim/layout';
import type { ComponentId, Signal, SimState } from '@/sim/types';
import {
  createInitialState, stepSim, triggerCacheMiss, triggerDMA,
  triggerDiskInterrupt, triggerKeyboardInterrupt, triggerPageFault,
  spawnProcess, killProcess, generatePacket,
  triggerMouseClick, triggerSyscall, triggerContextSwitch,
  triggerGpuRender, triggerTimerInterrupt,
  type Emission,
} from '@/sim/engine';

const BASE_CYCLES_PER_SEC = 3; // simulation cycles per second at 1× speed

import { sound } from '@/sim/audio';

let sigId = 0;
let lastSoundTime = 0;
function spawnSignal(e: Emission): Signal {
  const now = performance.now();
  if (now - lastSoundTime > 60) { // Rate limit to max 16 audio pulses per second
    lastSoundTime = now;
    sound.playSignalPulse(e.kind);
  }
  return {
    id: `sig${sigId++}`,
    pathId: e.pathId,
    kind: e.kind,
    progress: 0,
    speed: (e.speed ?? 1.5) * 0.5, // progress units per second
    payload: e.payload,
    color: e.color,
  };
}

export default function App() {
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);
  const [sim, setSim] = useState<SimState>(() => createInitialState());
  const [signals, setSignals] = useState<Signal[]>([]);
  const [focused, setFocused] = useState<ComponentId | null>(null);
  const [activeComponents, setActiveComponents] = useState<Set<ComponentId>>(new Set());

  const camera = useCamera(vw, vh);
  const simRef = useRef(sim);
  simRef.current = sim;
  const runningRef = useRef(sim.running);
  runningRef.current = sim.running;
  const speedRef = useRef(sim.speed);
  speedRef.current = sim.speed;
  const signalsRef = useRef(signals);
  signalsRef.current = signals;

  // Track viewport size
  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Main simulation loop using requestAnimationFrame with time-based stepping.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (runningRef.current) {
        acc += dt * BASE_CYCLES_PER_SEC * speedRef.current;
        let emissions: Emission[] = [];
        let stepped = false;
        while (acc >= 1) {
          acc -= 1;
          const e = stepSim(simRef.current);
          emissions = emissions.concat(e);
          stepped = true;
        }
        if (stepped) {
          setSim({ ...simRef.current });
          // spawn signals
          if (emissions.length) {
            setSignals(prev => {
              const next = [...prev];
              for (const e of emissions) next.push(spawnSignal(e));
              // cap to avoid runaway
              return next.length > 400 ? next.slice(-400) : next;
            });
          }
        }
      }

      // Advance signal progress and cull expired.
      setSignals(prev => {
        if (prev.length === 0) return prev;
        const next: Signal[] = [];
        for (const s of prev) {
          const np = s.progress + s.speed * dt;
          if (np < 1) next.push({ ...s, progress: np });
        }
        return next;
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Derive "active" components from current signals for glow effects.
  useEffect(() => {
    if (signals.length === 0) {
      if (activeComponents.size !== 0) setActiveComponents(new Set());
      return;
    }
    const set = new Set<ComponentId>();
    for (const s of signals) {
      const path = PATH_MAP[s.pathId];
      if (path) { set.add(path.from); set.add(path.to); }
    }
    if (set.size !== activeComponents.size || [...set].some(c => !activeComponents.has(c))) {
      setActiveComponents(set);
    }
  }, [signals]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFocus = useCallback((id: ComponentId) => {
    setFocused(id);
    const node = COMPONENT_MAP[id];
    camera.focus(id, node.rect);
  }, [camera]);

  const handleBack = useCallback(() => {
    setFocused(null);
    camera.reset();
  }, [camera]);

  const inject = useCallback((fn: (s: SimState) => Emission[]) => {
    const e = fn(simRef.current);
    setSim({ ...simRef.current });
    if (e.length) setSignals(prev => [...prev, ...e.map(spawnSignal)]);
  }, []);

  // Wheel zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    camera.zoomAt(e.clientX, e.clientY, factor);
  }, [camera]);

  // Drag pan
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    camera.panBy(dx, dy);
  }, [camera]);
  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(14,165,233,0.08), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(45,212,191,0.06), transparent 50%)',
      }} />

      <Motherboard cam={camera.cam} vw={vw} vh={vh} sim={sim} onFocus={handleFocus} activeComponents={activeComponents} />
      <SignalOverlay signals={signals} cam={camera.cam} vw={vw} vh={vh} />

      <HeaderBar />
      <StatsBar sim={sim} />
      <InteractionPanel
        onKeyboard={() => inject(triggerKeyboardInterrupt)}
        onDisk={() => inject(triggerDiskInterrupt)}
        onPageFault={() => inject(triggerPageFault)}
        onCacheMiss={() => inject(triggerCacheMiss)}
        onDMA={() => inject(triggerDMA)}
        onSpawn={() => inject(spawnProcess)}
        onKill={() => inject(killProcess)}
        onPacket={() => inject(generatePacket)}
        onMouseClick={() => inject(triggerMouseClick)}
        onSyscall={() => inject(triggerSyscall)}
        onContextSwitch={() => inject(triggerContextSwitch)}
        onGpuRender={() => inject(triggerGpuRender)}
        onTimerInterrupt={() => inject(triggerTimerInterrupt)}
      />
      <LogPanel sim={sim} />

      {focused && <DetailView id={focused} sim={sim} onBack={handleBack} />}

      <Controls
        sim={sim}
        onToggleRun={() => { simRef.current.running = !simRef.current.running; setSim({ ...simRef.current }); }}
        onStep={() => { const e = stepSim(simRef.current); setSim({ ...simRef.current }); if (e.length) setSignals(prev => [...prev, ...e.map(spawnSignal)]); }}
        onReset={() => { const fresh = createInitialState(); setSim(fresh); setSignals([]); setFocused(null); camera.reset(); }}
        onSpeed={(s) => { simRef.current.speed = s; setSim({ ...simRef.current }); }}
        onZoomIn={() => camera.zoomAt(vw / 2, vh / 2, 1.4)}
        onZoomOut={() => camera.zoomAt(vw / 2, vh / 2, 1 / 1.4)}
        onResetView={handleBack}
      />

      <HelpHint />
    </div>
  );
}

function HeaderBar() {
  return (
    <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur border border-slate-700/60">
      <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
      <span className="text-sm font-mono tracking-wider text-slate-200">VIRTUAL OS ARCHITECTURE SIMULATOR</span>
    </div>
  );
}

function HelpHint() {
  return (
    <div className="absolute bottom-4 right-4 z-30 text-[10px] font-mono text-slate-500 text-right leading-relaxed">
      <div>Scroll to zoom · Drag to pan · Click a component to inspect</div>
      <div className="text-slate-600">Every signal you see is a real CPU / OS event.</div>
    </div>
  );
}


