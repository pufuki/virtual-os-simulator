import { useEffect, useRef } from 'react';
import type { Camera } from './camera';
import { PATH_MAP, pointAt, KIND_TRACE_COLORS } from '@/sim/layout';
import type { Signal } from '@/sim/types';

interface Props {
  signals: Signal[];
  cam: Camera;
  vw: number;
  vh: number;
  hoveredPath?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Canvas overlay that draws traveling signals (particles/binary) along bus paths.
// Kept as a single canvas for performance with hundreds of entities.
export function SignalOverlay({ signals, cam, vw, vh, hoveredPath }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signalsRef = useRef(signals);
  signalsRef.current = signals;
  const camRef = useRef(cam);
  camRef.current = cam;

  useEffect(() => {
    let raf = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== vw * dpr || canvas.height !== vh * dpr) {
        canvas.width = vw * dpr;
        canvas.height = vh * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      const c = camRef.current;
      const toScreen = (x: number, y: number) => ({
        x: (x - c.cx) * c.zoom + vw / 2,
        y: (y - c.cy) * c.zoom + vh / 2,
      });

      // Draw bus path traces — always visible, brightened by kind
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const p of Object.values(PATH_MAP)) {
        ctx.beginPath();
        p.points.forEach((pt, i) => {
          const s = toScreen(pt.x, pt.y);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        const baseColor = KIND_TRACE_COLORS[p.kind] || '#94a3b8';
        const isHovered = p.id === hoveredPath;
        const alpha = isHovered ? 0.9 : 0.45;
        ctx.lineWidth = Math.max(1, (isHovered ? 2.8 : 1.8) * Math.min(c.zoom, 1.5));
        ctx.strokeStyle = hexToRgba(baseColor, alpha);
        ctx.stroke();
      }

      // Draw signals as glowing particles
      for (const sig of signalsRef.current) {
        const path = PATH_MAP[sig.pathId];
        if (!path) continue;
        const pos = pointAt(path, sig.progress);
        const s = toScreen(pos.x, pos.y);
        if (s.x < -20 || s.x > vw + 20 || s.y < -20 || s.y > vh + 20) continue;

        const r = Math.max(2, 3.5 * Math.min(c.zoom, 2));
        // glow
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3);
        grad.addColorStop(0, sig.color);
        grad.addColorStop(0.4, sig.color + '88');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
        // core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // payload label when zoomed in
        if (sig.payload && c.zoom > 1.2) {
          ctx.fillStyle = sig.color;
          ctx.font = `${Math.max(8, 9 * Math.min(c.zoom, 1.8))}px ui-monospace, monospace`;
          ctx.fillText(sig.payload, s.x + r + 2, s.y - r - 2);
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [vw, vh, hoveredPath]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
