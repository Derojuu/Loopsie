"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { registerGsap, ScrollTrigger } from "@/lib/gsap";

interface UseAccordionOptions {
  /** Return false to ignore a toggle (e.g. features only collapse on mobile). */
  enabled?: () => boolean;
  /** Called before the state flips when an item is about to open. */
  onBeforeOpen?: (index: number, previous: number | null) => void;
  /** Called after an item opened (next frame, once the DOM reflects the state). */
  onOpen?: (index: number) => void;
  /** Refresh ScrollTrigger this many ms after a toggle (the CSS transition length). */
  refreshDelay?: number;
}

/**
 * Single-open accordion state mirroring the original `Accordion` / `faq` /
 * `features` modules: opening an item closes the others, clicking the open
 * item closes it.
 */
export function useAccordion(initial: number | null, options: UseAccordionOptions = {}) {
  const [openIndex, setOpenIndex] = useState<number | null>(initial);
  const openRef = useRef(openIndex);
  const optionsRef = useRef(options);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  const toggle = useCallback((index: number) => {
    const { enabled, onBeforeOpen, onOpen, refreshDelay } = optionsRef.current;
    if (enabled && !enabled()) return;
    const previous = openRef.current;
    const opening = previous !== index;
    if (opening) onBeforeOpen?.(index, previous);
    const next = opening ? index : null;
    openRef.current = next;
    setOpenIndex(next);
    if (opening && onOpen) requestAnimationFrame(() => onOpen(index));
    if (refreshDelay !== undefined) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        registerGsap();
        ScrollTrigger.refresh();
      }, refreshDelay);
    }
  }, []);

  return { openIndex, toggle };
}

/** Space taken by the fixed nav (`Nav.room` in the original): offset + height. */
export function getNavRoom(): number {
  const style = getComputedStyle(document.body);
  const offset = parseFloat(style.getPropertyValue("--nav-offset")) || 0;
  const height = parseFloat(style.getPropertyValue("--nav-height")) || 0;
  return offset + height;
}
