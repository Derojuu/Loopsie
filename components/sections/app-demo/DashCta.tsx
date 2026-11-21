"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";

const LINES = ["black", "sage", "sky", "apricot", "main"] as const;
const RINGS = ["", "dash-cta_ring--mid", "dash-cta_ring--late", "dash-cta_ring--end"] as const;

function Lines({ hidden }: { hidden?: boolean }) {
  return LINES.map((c) => (
    <span key={c} className={`dash-cta_line dash-cta_line--${c}`} aria-hidden={hidden ? "true" : undefined} />
  ));
}

interface DashCtaProps {
  /** In-flow variant used under the desktop demo (`dash-cta--inline`). */
  inline?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Sign-up CTA in a frame whose border follows the button's colour sweep
 * (`--p1..--p4`, written by `<Button>`) with pulsing rings that pause offscreen.
 */
export function DashCta({ inline = false, className, style }: DashCtaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("dash-cta", inline && "dash-cta--inline relative", paused && "is-paused", className)}
      data-button-frame=""
      style={style}
    >
      {RINGS.map((r) => (
        <span key={r || "base"} className={cn("dash-cta_ring", r)} aria-hidden="true">
          <Lines />
        </span>
      ))}
      <div className="dash-cta_box relative flex border border-solid border-transparent p-20">
        <Lines hidden />
        <Button track="dashboard-signup" />
      </div>
    </div>
  );
}
