"use client";

import { useEffect, useRef } from "react";
import { FOOTER_VIDEO } from "@/constants/footer";

/**
 * Fixed full-screen WebGL layer behind <main>. It draws the footer's
 * dot-matrix video once `[data-footer-trigger]` scrolls into view.
 * Must be rendered after </main> so it stays underneath the page content.
 */
export function GlobalCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const section = document.querySelector<HTMLElement>("[data-footer-trigger]");
    if (!el || !section) return;

    let cleanup: (() => void) | null = null;
    let cancelled = false;
    // The GL code is only needed client-side; load it off the critical path.
    import("./gl/footerRenderer").then(({ mountFooterRenderer }) => {
      if (cancelled) return;
      try {
        cleanup = mountFooterRenderer(el, section, section.dataset.footerVideo || FOOTER_VIDEO);
      } catch (error) {
        console.warn("[GL] footer renderer unavailable", error);
      }
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div className="canvas_parent fixed top-0 right-0 left-0 h-(--screen-h)" aria-hidden="true">
      <canvas ref={canvas} className="canvas block h-full w-full" />
    </div>
  );
}
