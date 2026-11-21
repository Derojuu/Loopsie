"use client";

import { useEffect, useState } from "react";

const isTouch = () => window.matchMedia("(hover: none) and (pointer: coarse)").matches;

/**
 * Mirrors the original `Sizes` resize policy: debounced 300ms, fires on width
 * changes (and on height changes for wide, non-touch screens). Also bumps once
 * when web fonts finish loading, since several measurements depend on them.
 * Returns a counter to use as an effect dependency.
 */
export function useResizeKey(): number {
  const [resizeKey, setResizeKey] = useState(0);

  useEffect(() => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let alive = true;

    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const widthChanged = w !== width;
        const heightChanged = !isTouch() && width >= 991 && h !== height;
        width = w;
        height = h;
        if (widthChanged || heightChanged) setResizeKey((k) => k + 1);
      }, 300);
    };

    if (document.fonts && document.fonts.status !== "loaded") {
      document.fonts.ready.then(() => alive && setResizeKey((k) => k + 1));
    }
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return resizeKey;
}
