"use client";

import type Lenis from "lenis";
import { gsap } from "@/lib/gsap";
import { STACK } from "@/constants/highlights";
import { MEDIA } from "@/constants/motion";

const TOUCH_EVENTS = ["touchstart", "touchend", "touchcancel"] as const;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Settles the scroll on the nearest card once the user stops scrolling inside
 * the stacked range (port of the original `Snap` helper).
 */
export function createStackSnap(lenis: Lenis | null, stops: () => number[]) {
  const reduce = window.matchMedia(MEDIA.reducedMotion).matches;
  let off: (() => void) | null = null;
  let timer = 0;
  let dir = 1;
  let touching = false;

  const snap = () => {
    if (touching || !lenis || lenis.isStopped || lenis.isLocked) return;
    const list = stops();
    const target = lenis.targetScroll;
    const i = list.findIndex((s) => s > target);
    if (i < 1) return;
    const from = list[i - 1];
    const span = list[i] - from;
    const progress = (target - from) / span;
    const dest = (dir > 0 ? progress > STACK.snap.pass : 1 - progress <= STACK.snap.pass) ? list[i] : from;
    const distance = Math.abs(dest - target);
    if (distance > 1) {
      lenis.scrollTo(dest, {
        duration: gsap.utils.clamp(0.5, STACK.snap.time, (distance / span) * 2),
        easing: easeInOutCubic,
      });
    }
  };

  const arm = () => {
    if (!off) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(snap, STACK.snap.idle);
  };

  const onTouch = (e: TouchEvent) => {
    touching = e.type === "touchstart";
    if (!touching) arm();
  };
  const touch = window.matchMedia("(hover: none)").matches;
  if (touch) TOUCH_EVENTS.forEach((t) => window.addEventListener(t, onTouch, { passive: true }));

  const watch = (active: boolean) => {
    off?.();
    off = null;
    window.clearTimeout(timer);
    if (!active || reduce || !lenis) return;
    let last = lenis.targetScroll;
    dir = lenis.direction || 1;
    const onScroll = () => {
      if (lenis.targetScroll === last) return;
      dir = Math.sign(lenis.targetScroll - last);
      last = lenis.targetScroll;
      arm();
    };
    off = lenis.on("scroll", onScroll);
    arm();
  };

  return {
    watch,
    destroy: () => {
      watch(false);
      if (touch) TOUCH_EVENTS.forEach((t) => window.removeEventListener(t, onTouch));
    },
  };
}
