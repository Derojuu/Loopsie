"use client";

import { useEffect, type RefObject } from "react";
import { registerGsap, SplitText } from "@/lib/gsap";
import { MEDIA } from "@/constants/motion";

/** Attribute marking pre-split characters (render each glyph as `<span data-weight-char>`). */
export const WEIGHT_CHAR_ATTR = "data-weight-char";

export interface WeightHoverOptions {
  /** Weight reached by the character directly under the cursor. */
  maxWeight?: number;
  /** Falloff radius as a fraction of the element width. */
  radius?: number;
}

/** Original `WeightHover` constants. */
const MAX_WEIGHT = 900;
const RADIUS = 0.9;

interface CharTween {
  el: HTMLElement;
  to: (value: number) => void;
}

/**
 * Variable-font "magnifier": characters near the cursor get heavier, falling
 * off with distance (port of the original `WeightHover` module).
 *
 * Characters are taken from `[data-weight-char]` children when present
 * (pre-split in JSX), otherwise the element is split with SplitText at runtime.
 * Each character's width is locked at the base weight so the line never reflows.
 * Only active on fine pointers without reduced motion.
 */
export function useWeightHover<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { maxWeight = MAX_WEIGHT, radius = RADIUS }: WeightHoverOptions = {},
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia(MEDIA.finePointer).matches || window.matchMedia(MEDIA.reducedMotion).matches) return;

    const gsap = registerGsap();
    let destroyed = false;
    let split: SplitText | null = null;
    let chars: CharTween[] | null = null;
    let base = 400;
    let frame = 0;

    const reset = () => {
      split?.revert();
      split = null;
      chars?.forEach(({ el: c }) => {
        c.style.removeProperty("width");
        c.style.removeProperty("text-align");
        c.style.removeProperty("font-variation-settings");
      });
      chars = null;
    };

    const build = () => {
      if (destroyed) return;
      reset();
      if (!el.offsetWidth) return;

      const match = getComputedStyle(el).fontVariationSettings.match(/wght"?\s+([\d.]+)/);
      base = match ? parseFloat(match[1]) : 400;

      let nodes = [...el.querySelectorAll<HTMLElement>(`[${WEIGHT_CHAR_ATTR}]`)];
      if (!nodes.length) {
        split = SplitText.create(el, { type: "chars" });
        nodes = split.chars as HTMLElement[];
      }
      const widths = nodes.map((c) => c.getBoundingClientRect().width);
      chars = nodes.map((c, i) => {
        const state = { weight: base };
        c.style.width = `${widths[i]}px`;
        c.style.textAlign = "center";
        return {
          el: c,
          to: gsap.quickTo(state, "weight", {
            duration: 0.3,
            ease: "power2.out",
            onUpdate: () => {
              c.style.fontVariationSettings = `'wght' ${state.weight}`;
            },
          }),
        };
      });
    };

    const onMove = (event: MouseEvent) => {
      if (!chars) return;
      const reach = el.offsetWidth * radius;
      for (const char of chars) {
        const r = char.el.getBoundingClientRect();
        const d = Math.hypot(event.clientX - r.left - r.width / 2, event.clientY - r.top - r.height / 2);
        char.to(base + (maxWeight - base) * Math.max(0, 1 - d / reach));
      }
    };
    const onLeave = () => chars?.forEach((c) => c.to(base));
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(build);
    };

    el.addEventListener("mouseenter", onMove);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);
    document.fonts.ready.then(build);

    return () => {
      destroyed = true;
      cancelAnimationFrame(frame);
      el.removeEventListener("mouseenter", onMove);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      reset();
    };
  }, [ref, maxWeight, radius]);
}
