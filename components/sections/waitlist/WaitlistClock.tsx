"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/utils/cn";
import { MEDIA } from "@/constants/motion";
import {
  CLOCK_FLUID_IDLE,
  CLOCK_HANDS,
  CLOCK_MAX_STEPS,
  CLOCK_MAX_TEXTURE,
  CLOCK_PARAMS,
  CLOCK_STEP,
  CLOCK_TICKS,
  type ClockHand,
} from "@/constants/waitlist";
import { ClockSim, type SimHand } from "@/components/sections/waitlist/clockSim";

const HAND_ORDER: ClockHand[] = ["second", "minute", "hour"];

/**
 * Analogue clock running 11× fast whose second hand sweeps a pile of
 * coloured shapes around the dial; moving the pointer stirs them.
 */
export function WaitlistClock() {
  const root = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handRefs = useRef<Partial<Record<ClockHand, HTMLDivElement | null>>>({});

  useEffect(() => {
    const el = root.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;

    const params = CLOCK_PARAMS;
    let clockMs = Date.now();
    const hands: Record<ClockHand, SimHand> = {
      second: { angle: 0, omega: 0, length: CLOCK_HANDS.second.length, active: true },
      minute: { angle: 0, omega: 0, length: CLOCK_HANDS.minute.length, active: params.sweepAll },
      hour: { angle: 0, omega: 0, length: CLOCK_HANDS.hour.length, active: params.sweepAll },
    };
    const handList = HAND_ORDER.map((k) => hands[k]);

    const setHand = (key: ClockHand, angle: number, omega: number) => {
      hands[key].angle = angle;
      hands[key].omega = omega;
      const node = handRefs.current[key];
      if (node) node.style.rotate = `${angle}rad`;
    };
    const updateHands = () => {
      const d = new Date(clockMs);
      const s = d.getSeconds() + d.getMilliseconds() / 1000;
      const m = d.getMinutes() + s / 60;
      const h = (d.getHours() % 12) + m / 60;
      const ts = params.timeScale;
      setHand("second", (s / 60) * Math.PI * 2, ((Math.PI * 2) / 60) * ts);
      setHand("minute", (m / 60) * Math.PI * 2, ((Math.PI * 2) / 3600) * ts);
      setHand("hour", (h / 12) * Math.PI * 2, ((Math.PI * 2) / 43200) * ts);
    };
    updateHands();

    let size = el.clientWidth || 460;
    const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 3, CLOCK_MAX_TEXTURE / size);
    let sim: ClockSim;
    try {
      sim = new ClockSim(canvas, size, pixelRatio(), params);
    } catch {
      return;
    }
    sim.step(CLOCK_STEP, handList, false, 1);
    sim.render();

    // Pointer → flow field ("fluid" stirring), desktop only.
    const pointer = { last: null as { x: number; y: number } | null, input: -Infinity, dx: 0, dy: 0, pending: false, x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > size || y > size) {
        pointer.last = null;
        return;
      }
      const ux = x / size;
      const uy = y / size;
      if (pointer.last) {
        pointer.dx += (ux - pointer.last.x) * params.fluidSplat;
        pointer.dy += (uy - pointer.last.y) * params.fluidSplat;
        pointer.x = ux;
        pointer.y = uy;
        pointer.pending = true;
        pointer.input = performance.now();
      }
      pointer.last = { x: ux, y: uy };
    };
    const finePointer = window.matchMedia(MEDIA.finePointer).matches;
    if (finePointer) window.addEventListener("pointermove", onPointerMove, { passive: true });

    let inView = false;
    const observer = new IntersectionObserver((entries) => (inView = entries[0].isIntersecting), {
      rootMargin: "15%",
    });
    observer.observe(el);

    let simTime = 0;
    const tick = (_time: number, deltaTime: number) => {
      if (!inView) return;
      const dt = Math.min(deltaTime || 16.666, 33) / 1000;
      clockMs += dt * 1000 * params.timeScale;
      updateHands();
      simTime = Math.min(simTime + dt, CLOCK_STEP * CLOCK_MAX_STEPS);
      const steps = Math.floor(simTime / CLOCK_STEP);
      simTime -= steps * CLOCK_STEP;
      const fluidActive = performance.now() - pointer.input < CLOCK_FLUID_IDLE;
      if (pointer.pending) {
        sim.splat(pointer.x, pointer.y, pointer.dx, pointer.dy);
        pointer.dx = pointer.dy = 0;
        pointer.pending = false;
      }
      sim.step(CLOCK_STEP, handList, fluidActive, steps);
      if (fluidActive) sim.fadeFlow();
      sim.render();
    };
    gsap.ticker.add(tick);

    const resizeObserver = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (!w || Math.abs(w - size) < 2) return;
      size = w;
      sim.resize(size, pixelRatio());
      sim.render();
    });
    resizeObserver.observe(el);

    return () => {
      gsap.ticker.remove(tick);
      observer.disconnect();
      resizeObserver.disconnect();
      if (finePointer) window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div
      ref={root}
      className="clock relative aspect-square overflow-clip rounded-full border border-black bg-white w-full max-w-460 l:mt-18 l:max-w-300 s:absolute s:right-20 s:bottom-20 s:mt-0 s:w-175"
      role="img"
      aria-label="Clock"
    >
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" aria-hidden="true">
        {CLOCK_TICKS.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="black" strokeWidth={t.width} />
        ))}
      </svg>
      <canvas ref={canvasRef} className="clock_canvas absolute inset-0 size-full" aria-hidden="true" />
      {(["hour", "minute", "second"] as const).map((key) => {
        const hand = CLOCK_HANDS[key];
        return (
          <div
            key={key}
            ref={(node) => {
              handRefs.current[key] = node;
            }}
            className={cn(
              `clock_hand--${key} absolute bottom-1/2 left-1/2 -translate-x-1/2 origin-bottom`,
              hand.width,
              hand.height,
              hand.color,
              hand.rounded && "rounded-full",
            )}
          />
        );
      })}
      <div className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-coral bg-black" />
    </div>
  );
}
