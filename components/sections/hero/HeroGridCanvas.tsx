"use client";

import { useEffect, useRef } from "react";
import { registerGsap, ScrollTrigger } from "@/lib/gsap";
import { HeroGridRenderer } from "@/components/sections/hero/heroGridGL";
import type { HeroGridState } from "@/components/sections/hero/heroShapesController";

interface HeroGridCanvasProps {
  state: HeroGridState;
}

const isTouch = () => window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const isMobileUA = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/**
 * Fixed full-screen WebGL layer behind the page content: the coral 34px grid
 * revealed below the hero frame, with a mouse-driven fluid trail. Disabled on
 * touch devices, where the CSS `.hero_grid` fallback is used instead.
 */
export function HeroGridCanvas({ state }: HeroGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isTouch()) return;
    const gsap = registerGsap();

    let renderer: HeroGridRenderer;
    try {
      renderer = new HeroGridRenderer(canvas, state, !isMobileUA());
    } catch {
      return;
    }

    // Only draw while the hero or intro is on screen.
    const header = canvas.closest("header");
    const intro = document.querySelector(".intro");
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target)));
      if (!visible.size) renderer.clear();
    });
    [header, intro].forEach((el) => el && observer.observe(el));

    const tick = () => {
      if (visible.size) renderer.render();
    };
    gsap.ticker.add(tick);

    const onMouseMove = (e: MouseEvent) => (visible.size ? renderer.pointer(e) : undefined);
    const onResize = () => renderer.resize();
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    // Freeze the grid in place once the intro pins (original `stopGrid`).
    const stopGrid = intro
      ? ScrollTrigger.create({
          trigger: intro,
          start: "top top",
          onEnter: () => {
            state.lockedScroll = window.scrollY;
            state.scrollLocked = true;
          },
          onLeaveBack: () => {
            state.scrollLocked = false;
          },
        })
      : null;

    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      gsap.ticker.remove(tick);
      observer.disconnect();
      stopGrid?.kill();
      state.scrollLocked = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      renderer.destroy();
    };
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      className="hero_gl pointer-events-none fixed left-0 top-0 block w-full h-(--screen-h) -z-1"
      aria-hidden="true"
    />
  );
}
