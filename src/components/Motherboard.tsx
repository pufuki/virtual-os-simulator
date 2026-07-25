import { sound } from '@/sim/audio';
import { useState } from 'react';
import type { Camera } from './camera';
import { COMPONENTS, COMPONENT_MAP, CONTAINERS, WORLD_H, WORLD_W } from '@/sim/layout';
import type { ComponentId, SimState } from '@/sim/types';

interface Props {
  cam: Camera;
  vw: number;
  vh: number;
  sim: SimState;
  onFocus: (id: ComponentId) => void;
  activeComponents: Set<ComponentId>;
}

const GROUP_LABELS: Record<string, string> = {
  cpu: 'PROCESSOR',
  memory: 'MEMORY HIERARCHY',
  bus: 'SYSTEM BUS',
  io: 'I/O & DEVICES',
  kernel: 'OPERATING SYSTEM',
};

export function Motherboard({ cam, vw, vh, sim, onFocus, activeComponents }: Props) {
  const [hovered, setHovered] = useState<ComponentId | null>(null);
  const toScreen = (x: number, y: number) => ({
    x: (x - cam.cx) * cam.zoom + vw / 2,
    y: (y - cam.cy) * cam.zoom + vh / 2,
  });


  const hoveredNode = hovered ? COMPONENT_MAP[hovered] : null;
  // Show group section labels at all zoom levels
  const showLabels = true;

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      onMouseLeave={() => setHovered(null)}
    >
      {/* Background grid */}
      <defs>
        <pattern id="grid" width={40 * cam.zoom} height={40 * cam.zoom} patternUnits="userSpaceOnUse">
          <path d={`M ${40 * cam.zoom} 0 L 0 0 0 ${40 * cam.zoom}`} fill="none" stroke="rgba(56,189,248,0.05)" strokeWidth="1" />
        </pattern>
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(2,6,23,0.6)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Group labels when zoomed out */}
      {showLabels &&
        Object.entries(GROUP_LABELS).map(([group, label]) => {
          const items = COMPONENTS.filter(c => c.group === group);
          if (items.length === 0) return null;
          const xs = items.map(c => c.rect.x);
          const ys = items.map(c => c.rect.y);
          const minX = Math.min(...xs);
          const minY = Math.min(...ys);
          const s = toScreen(minX, minY - 28);
          if (s.x < -200 || s.x > vw + 200 || s.y < -50 || s.y > vh + 50) return null;
          return (
            <text key={group} x={s.x} y={s.y} fill="rgba(148,163,184,0.6)"
              fontSize={Math.max(9, 11 * cam.zoom)} fontFamily="ui-monospace, monospace"
              letterSpacing="2" style={{ pointerEvents: 'none' }}>
              {label}
            </text>
          );
        })}

      {/* Components */}
      {COMPONENTS.map(c => {
        const s = toScreen(c.rect.x, c.rect.y);
        const w = c.rect.w * cam.zoom;
        const h = c.rect.h * cam.zoom;
        if (s.x + w < -100 || s.x > vw + 100 || s.y + h < -100 || s.y > vh + 100) return null;
        const isHovered = hovered === c.id;
        const isActive = activeComponents.has(c.id);
        const isContainer = CONTAINERS.includes(c.id);
        // Children of a container (CPU/SystemBus) dim when zoomed out so the
        // container reads as a single block until you zoom in.
        const isChildOfContainer =
          (c.group === 'cpu' && c.id !== 'cpu') ||
          (c.group === 'bus' && c.id !== 'systemBus');
        const dim = isChildOfContainer && cam.zoom < 0.7;
        return (
          <g key={c.id} transform={`translate(${s.x},${s.y})`}
            style={{ cursor: 'pointer', opacity: dim ? 0.35 : 1 }}
            onMouseEnter={() => setHovered(c.id)}
            onClick={(e) => { e.stopPropagation(); sound.playComponentClick(); onFocus(c.id); }}>
            <rect width={w} height={h} rx={8} ry={8}
              fill={isContainer ? 'rgba(15,23,42,0.25)' : isHovered ? c.color + '22' : 'rgba(15,23,42,0.72)'}
              stroke={c.color}
              strokeWidth={isHovered ? 2.5 : isActive ? 2 : isContainer ? 1.5 : 1}
              strokeOpacity={isHovered ? 1 : isActive ? 0.9 : isContainer ? 0.6 : 0.5}
              strokeDasharray={isContainer ? '6 5' : undefined}
              style={{
                transition: 'stroke-width 0.15s, fill 0.15s, opacity 0.2s',
                filter: isActive ? `drop-shadow(0 0 ${6 * cam.zoom}px ${c.color})` : 'none',
              }} />
            {/* Label */}
            {(cam.zoom > 0.25 || isHovered || isContainer) && (
              <text x={w / 2} y={isContainer ? 18 : h / 2} textAnchor={isContainer ? 'start' : 'middle'} dominantBaseline={isContainer ? 'hanging' : 'middle'}
                fill={c.color} fontSize={Math.max(9, Math.min(14, 12 * Math.min(cam.zoom, 1.5)))}
                fontFamily="ui-monospace, monospace" fontWeight="600"
                style={{ pointerEvents: 'none' }}>
                {cam.zoom < 0.9 ? c.short : c.label}
              </text>
            )}
            {/* Activity pulse indicator */}
            {isActive && (
              <circle cx={w - 8} cy={8} r={3} fill={c.color}>
                <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      {/* Hover tooltip */}
      {hoveredNode && (
        <HoverTooltip node={hoveredNode} sim={sim} toScreen={toScreen} vw={vw} vh={vh} />
      )}

      <rect width="100%" height="100%" fill="url(#vignette)" style={{ pointerEvents: 'none' }} />
      <WorldBounds cam={cam} vw={vw} vh={vh} />
    </svg>
  );
}

function WorldBounds({ cam, vw, vh }: { cam: Camera; vw: number; vh: number }) {
  const toScreen = (x: number, y: number) => ({
    x: (x - cam.cx) * cam.zoom + vw / 2,
    y: (y - cam.cy) * cam.zoom + vh / 2,
  });
  const tl = toScreen(0, 0);
  const w = WORLD_W * cam.zoom;
  const h = WORLD_H * cam.zoom;
  return (
    <rect x={tl.x} y={tl.y} width={w} height={h} fill="none"
      stroke="rgba(56,189,248,0.15)" strokeWidth="1" strokeDasharray="6 6"
      style={{ pointerEvents: 'none' }} />
  );
}

function HoverTooltip({
  node, sim, toScreen, vw, vh,
}: {
  node: typeof COMPONENTS[number];
  sim: SimState;
  toScreen: (x: number, y: number) => { x: number; y: number };
  vw: number;
  vh: number;
}) {
  const s = toScreen(node.rect.x, node.rect.y + node.rect.h + 8);
  const w = 280;
  const x = Math.min(Math.max(s.x, 8), vw - w - 8);
  const y = Math.min(s.y, vh - 140);
  const state = describeState(node.id, sim);
  return (
    <g transform={`translate(${x},${y})`} style={{ pointerEvents: 'none' }}>
      <rect width={w} height={state ? 132 : 92} rx={8} fill="rgba(2,6,23,0.96)"
        stroke={node.color} strokeWidth="1.5" />
      <text x={12} y={22} fill={node.color} fontSize="13" fontWeight="700"
        fontFamily="ui-monospace, monospace">{node.label}</text>
      <text x={12} y={42} fill="rgba(226,232,240,0.9)" fontSize="11"
        fontFamily="ui-sans-serif, system-ui">{node.purpose}</text>
      <foreignObject x={12} y={48} width={w - 24} height={40}>
        <div style={{ fontSize: '11px', color: 'rgba(148,163,184,0.95)', fontFamily: 'ui-sans-serif, system-ui', lineHeight: 1.35 }}>
          {node.detail}
        </div>
      </foreignObject>
      {state && (
        <foreignObject x={12} y={88} width={w - 24} height={40}>
          <div style={{ fontSize: '11px', color: node.color, fontFamily: 'ui-monospace, monospace', lineHeight: 1.4 }}>
            {state}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

function describeState(id: ComponentId, sim: SimState): string | null {
  switch (id) {
    case 'pc': return `Value: ${sim.pc}`;
    case 'ir': return `Instr: ${sim.ir}`;
    case 'sp': return `Value: ${sim.sp}`;
    case 'clock': return `Cycle: ${sim.cycle}`;
    case 'l1': return `Hits ${sim.caches.l1.hits} / Miss ${sim.caches.l1.misses}`;
    case 'l2': return `Hits ${sim.caches.l2.hits} / Miss ${sim.caches.l2.misses}`;
    case 'l3': return `Hits ${sim.caches.l3.hits} / Miss ${sim.caches.l3.misses}`;
    case 'ram': return `${sim.memory.length} cells active`;
    case 'scheduler': return `Algo: ${sim.schedulingAlgo}`;
    case 'processes': return `Running: PID ${sim.currentPid}`;
    case 'pic': return `${sim.interrupts.length} pending IRQ`;
    case 'dma': return sim.dmaActive ? `Transfer ${(sim.dmaProgress * 100).toFixed(0)}%` : 'Idle';
    case 'kernel': return sim.syscallActive ? `syscall ${sim.syscallName}` : 'Idle';
    default: return null;
  }
}
