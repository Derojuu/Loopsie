"use client";

import { useEffect, useRef, type RefObject } from "react";
import { DASH_GRID_GAP, DASH_GRID_STYLE, DASH_STAGE } from "@/constants/dashboard";

interface DashGridProps {
  /** The stage whose width defines the design-space scale. */
  stageRef: RefObject<HTMLElement | null>;
}

/**
 * Faint red grid behind the dashboard cards.
 * Approximation: the original rendered this with a WebGL shader that also lit up
 * lines under the cursor via a fluid simulation; here the same grid is drawn
 * statically with Canvas 2D (same cell size, colour and alpha).
 */
export function DashGrid({ stageRef }: DashGridProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!wrap || !canvas || !stage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = wrap.offsetWidth;
      const h = wrap.offsetHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const scale = stage.offsetWidth / DASH_STAGE.width;
      const cell = w / Math.max(1, Math.round(w / (DASH_GRID_GAP * scale)));
      ctx.fillStyle = `rgba(${DASH_GRID_STYLE.color},${DASH_GRID_STYLE.alpha})`;
      for (let x = 0; x <= w; x += cell) ctx.fillRect(Math.min(x, w - 1), 0, 1, h);
      for (let y = 0; y <= h; y += cell) ctx.fillRect(0, Math.min(y, h - 1), w, 1);
    };

    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    draw();
    return () => ro.disconnect();
  }, [stageRef]);

  return (
    <div
      ref={wrapRef}
      className="dash-grid pointer-events-none absolute bottom-10 left-58 right-10 top-75"
      data-gap={DASH_GRID_GAP}
    >
      <canvas ref={canvasRef} className="absolute left-0 top-0 block" aria-hidden="true" />
    </div>
  );
}
