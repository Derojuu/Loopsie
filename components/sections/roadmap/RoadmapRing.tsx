import type { CSSProperties } from "react";
import type { RoadmapRingData } from "@/constants/roadmap";

/** Dotted ring behind the wheel plus the coloured "lit" dash overlay. */
export function RoadmapRing({ variant, size, radius, arc, dash, x1, x2 }: RoadmapRingData) {
  const c = size / 2;
  const id = `roadmap-lit-${variant}`;
  return (
    <svg
      className={`roadmap_ring roadmap_ring--${variant}`}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      style={{ "--arc": arc } as CSSProperties}
      aria-hidden="true"
    >
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} x2={x2} y1="0" y2="0">
        <stop offset="0" stopOpacity="0" />
        <stop offset="0.2" />
        <stop offset="0.8" />
        <stop offset="1" stopOpacity="0" />
      </linearGradient>
      <circle cx={c} cy={c} r={radius} stroke="currentColor" strokeWidth="20" strokeDasharray={`1 ${dash}`} />
      <circle
        className="roadmap_lit"
        cx={c}
        cy={c}
        r={radius}
        stroke={`url(#${id})`}
        strokeWidth="20"
        strokeDasharray={`3 ${+(dash - 2).toFixed(4)}`}
      />
    </svg>
  );
}
