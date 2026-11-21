"use client";

import type { gsap as Gsap } from "gsap";
import { MEDIA } from "@/constants/motion";

export type GsapApi = typeof Gsap;
export type Timeline = gsap.core.Timeline;
export interface Point {
  x: number;
  y: number;
}

export const prefersReducedMotion = (): boolean => window.matchMedia(MEDIA.reducedMotion).matches;

/** Writes a unit-space position into the `--x` / `--y` vars read by `.unit-pos`. */
export function setPos(el: HTMLElement, { x, y }: Point): void {
  el.style.setProperty("--x", String(x));
  el.style.setProperty("--y", String(y));
}

const readPos = (el: HTMLElement): Point => ({
  x: parseFloat(el.style.getPropertyValue("--x")),
  y: parseFloat(el.style.getPropertyValue("--y")),
});

/** Tweens a `.unit-pos` element towards `target`, optionally along an upward arc. */
export function moveTo(
  gsap: GsapApi,
  el: HTMLElement,
  target: Point | (() => Point),
  { duration, arc = 0, ease = "power2.inOut" }: { duration: number; arc?: number; ease?: string },
): gsap.core.Tween {
  const state = { t: 0 };
  let from: Point | null = null;
  let to: Point | null = null;
  const capture = () => {
    from = readPos(el);
    to = typeof target === "function" ? target() : target;
  };
  return gsap.to(state, {
    t: 1,
    duration,
    ease,
    immediateRender: false,
    onStart: capture,
    onUpdate: () => {
      if (!from || !to) capture();
      const { t } = state;
      setPos(el, { x: from!.x + (to!.x - from!.x) * t, y: from!.y + (to!.y - from!.y) * t - arc * Math.sin(Math.PI * t) });
    },
    onComplete: () => {
      from = null;
      to = null;
    },
  });
}

/** Little press on a cursor's pointer graphic. */
export const tap = (gsap: GsapApi, cursor: HTMLElement): Timeline =>
  gsap
    .timeline()
    .to(cursor.firstElementChild, { scale: 0.8, duration: 0.1, ease: "power2.in" })
    .to(cursor.firstElementChild, { scale: 1, duration: 0.18, ease: "back.out(2)" });

/** Plays / pauses a loop while `el` is (nearly) on screen. */
export function whileVisible(el: Element, onIn: () => void, onOut: () => void): () => void {
  const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? onIn() : onOut()), {
    rootMargin: "10%",
  });
  observer.observe(el);
  return () => observer.disconnect();
}

/**
 * The illustrations mutate their DOM imperatively (cloned rows, swapped text).
 * Snapshot the pristine subtree so cleanup (unmount / StrictMode re-run) can restore it.
 */
export function snapshot(root: Element): () => void {
  const pristine = [...root.childNodes].map((node) => node.cloneNode(true));
  return () => root.replaceChildren(...pristine);
}
