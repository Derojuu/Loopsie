"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import Lenis from "lenis";
import { registerGsap, ScrollTrigger } from "@/lib/gsap";
import { LENIS_OPTIONS, MEDIA } from "@/constants/motion";

/** Tiny external store holding the page-wide Lenis instance. */
let current: Lenis | null = null;
const listeners = new Set<() => void>();

function setCurrent(next: Lenis | null): void {
  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Access the page-wide Lenis instance (null before mount / with reduced motion). */
export function useLenis(): Lenis | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}

interface SmoothScrollProps {
  children: ReactNode;
}

/** Lenis smooth scrolling driven by the GSAP ticker so ScrollTriggers stay in sync. */
export function SmoothScroll({ children }: SmoothScrollProps) {
  useEffect(() => {
    const gsap = registerGsap();
    if (window.matchMedia(MEDIA.reducedMotion).matches) return;

    const instance = new Lenis({ ...LENIS_OPTIONS, autoRaf: false });
    const onTick = (time: number) => instance.raf(time * 1000);

    instance.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    setCurrent(instance);

    return () => {
      gsap.ticker.remove(onTick);
      instance.destroy();
      setCurrent(null);
    };
  }, []);

  return <>{children}</>;
}
