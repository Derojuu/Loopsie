"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ADM_ASK_LABEL, ADM_ASK_VARS } from "@/constants/app-demo";
import { LoopsiiLogo } from "@/components/sections/app-demo/AdmArt";

/** Default label width before it is measured (value from the original render). */
const LABEL_W = 72;
/** Horizontal / vertical bleed of the (hover) fireworks layer around the button. */
const FIREWORKS = { x: 50, y: 70, width: 132 } as const;

/** "Ask Loopsii" launcher with the spinning conic ring and per-letter label reveal. */
export function AskFab() {
  const textRef = useRef<HTMLSpanElement>(null);
  const [labelW, setLabelW] = useState(LABEL_W);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => el.offsetWidth && setLabelW(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <button
      type="button"
      aria-label={ADM_ASK_LABEL}
      data-track="demo-ask-launcher"
      aria-expanded={false}
      className="ask-fab ring-conic app:absolute app:bottom-24 app:right-24 app:z-40 app:flex app:h-44 app:px-16 app:cursor-pointer app:items-center app:rounded-full app:text-note app:font-medium app:text-label-secondary app:hover:text-label-primary"
      style={ADM_ASK_VARS as CSSProperties}
    >
      <span
        className="ask-fab_fireworks"
        aria-hidden="true"
        style={{
          right: -FIREWORKS.x / 2,
          width: FIREWORKS.width + FIREWORKS.x,
          height: `calc(100% + ${FIREWORKS.y}px)`,
        }}
      />
      <span className="ask-fab_glow" aria-hidden="true" />
      <span className="ask-fab_ring" aria-hidden="true">
        <span className="ask-fab_ring-glow">
          <span className="ask-fab_ring-line is-thick" />
        </span>
        <span className="ask-fab_ring-line" />
      </span>
      <span className="ask-fab_logo app:relative app:flex app:size-22 app:items-center app:justify-center">
        <LoopsiiLogo className="app:h-13 app:w-16" />
      </span>
      <span className="ask-fab_label app:relative" style={{ "--label-gap": "6px", "--label-w": `${labelW}px` } as CSSProperties}>
        <span className="app:sr-only">{ADM_ASK_LABEL}</span>
        <span ref={textRef} className="ask-fab_text" aria-hidden="true">
          {[...ADM_ASK_LABEL].map((char, i) => (
            <span key={i} className="ask-fab_char" style={{ "--i": i } as CSSProperties}>
              {char}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}
