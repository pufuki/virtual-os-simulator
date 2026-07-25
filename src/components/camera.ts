import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentId } from '@/sim/types';
import { WORLD_H, WORLD_W } from '@/sim/layout';

export interface Camera {
  // Center of view in world coordinates.
  cx: number;
  cy: number;
  // Zoom factor: world units per screen px is (1/zoom).
  zoom: number;
  // Target for smooth interpolation.
  tcx: number;
  tcy: number;
  tzoom: number;
}

// Padding around the world so the camera can show some background but never the void.
const WORLD_PAD = 200;

export function fitCamera(vw: number = 1200, vh: number = 800): Camera {
  const zoom = Math.min(vw / WORLD_W, vh / WORLD_H) * 0.92;
  return { cx: WORLD_W / 2, cy: WORLD_H / 2, zoom, tcx: WORLD_W / 2, tcy: WORLD_H / 2, tzoom: zoom };
}

// Clamp camera center so the view never leaves the world bounds (+ padding).
function clampCenter(cx: number, cy: number, zoom: number, vw: number, vh: number) {
  const halfW = vw / 2 / zoom;
  const halfH = vh / 2 / zoom;
  const minX = -WORLD_PAD + halfW;
  const maxX = WORLD_W + WORLD_PAD - halfW;
  const minY = -WORLD_PAD + halfH;
  const maxY = WORLD_H + WORLD_PAD - halfH;
  return {
    cx: Math.min(Math.max(cx, minX), Math.max(minX, maxX)),
    cy: Math.min(Math.max(cy, minY), Math.max(minY, maxY)),
  };
}

// Compute a camera that frames a given world rect with padding.
export function focusRect(rect: { x: number; y: number; w: number; h: number }, vw: number, vh: number, pad = 1.4): Camera {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const zoomX = vw / (rect.w * pad);
  const zoomY = vh / (rect.h * pad);
  const zoom = Math.min(zoomX, zoomY);
  return { cx, cy, zoom, tcx: cx, tcy: cy, tzoom: zoom };
}

// Smoothly interpolate camera toward target each frame.
export function tickCamera(cam: Camera): Camera {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const k = 0.12;
  return {
    ...cam,
    cx: lerp(cam.cx, cam.tcx, k),
    cy: lerp(cam.cy, cam.tcy, k),
    zoom: lerp(cam.zoom, cam.tzoom, k),
  };
}

// Convert world coords to screen coords given camera + viewport.
export function worldToScreen(cam: Camera, vw: number, vh: number, x: number, y: number) {
  return {
    x: (x - cam.cx) * cam.zoom + vw / 2,
    y: (y - cam.cy) * cam.zoom + vh / 2,
  scale: cam.zoom,
  };
}

export interface CameraController {
  cam: Camera;
  setTarget: (c: Partial<Pick<Camera, 'tcx' | 'tcy' | 'tzoom'>>) => void;
  focus: (id: ComponentId, rect: { x: number; y: number; w: number; h: number }) => void;
  reset: () => void;
  panBy: (dx: number, dy: number) => void;
  zoomAt: (sx: number, sy: number, factor: number) => void;
}

export function useCamera(vw: number, vh: number): CameraController {
  const [cam, setCam] = useState<Camera>(() => fitCamera(vw, vh));
  const camRef = useRef(cam);
  camRef.current = cam;

  const setTarget = useCallback((c: Partial<Pick<Camera, 'tcx' | 'tcy' | 'tzoom'>>) => {
    setCam(prev => ({ ...prev, ...c }));
  }, []);

  const focus = useCallback((id: ComponentId, rect: { x: number; y: number; w: number; h: number }) => {
    const f = focusRect(rect, vw, vh, 1.5);
    const clamped = clampCenter(f.tcx, f.tcy, f.tzoom, vw, vh);
    setCam(prev => ({ ...prev, tcx: clamped.cx, tcy: clamped.cy, tzoom: f.tzoom }));
  }, [vw, vh]);

  const reset = useCallback(() => {
    const f = fitCamera(vw, vh);
    const clamped = clampCenter(f.tcx, f.tcy, f.tzoom, vw, vh);
    setCam(prev => ({ ...prev, tcx: clamped.cx, tcy: clamped.cy, tzoom: f.tzoom }));
  }, [vw, vh]);

  const panBy = useCallback((dx: number, dy: number) => {
    setCam(prev => {
      const ncx = prev.tcx - dx / prev.zoom;
      const ncy = prev.tcy - dy / prev.zoom;
      const clamped = clampCenter(ncx, ncy, prev.tzoom, vw, vh);
      return { ...prev, cx: clamped.cx, cy: clamped.cy, tcx: clamped.cx, tcy: clamped.cy };
    });
  }, [vw, vh]);

  const zoomAt = useCallback((sx: number, sy: number, factor: number) => {
    setCam(prev => {
      const newZoom = Math.max(0.15, Math.min(prev.tzoom * factor, 8));
      // keep point under cursor stable
      const wx = (sx - vw / 2) / prev.zoom + prev.tcx;
      const wy = (sy - vh / 2) / prev.zoom + prev.tcy;
      const ncx = wx - (sx - vw / 2) / newZoom;
      const ncy = wy - (sy - vh / 2) / newZoom;
      const clamped = clampCenter(ncx, ncy, newZoom, vw, vh);
      return { ...prev, tcx: clamped.cx, tcy: clamped.cy, tzoom: newZoom };
    });
  }, [vw, vh]);

  // animation loop for smooth camera
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setCam(prev => {
        const need =
          Math.abs(prev.cx - prev.tcx) > 0.5 ||
          Math.abs(prev.cy - prev.tcy) > 0.5 ||
          Math.abs(prev.zoom - prev.tzoom) > 0.001;
        if (!need) return prev;
        const ticked = tickCamera(prev);
        const clamped = clampCenter(ticked.cx, ticked.cy, ticked.zoom, vw, vh);
        return { ...ticked, cx: clamped.cx, cy: clamped.cy };
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [vw, vh]);

  return { cam, setTarget, focus, reset, panBy, zoomAt };
}
