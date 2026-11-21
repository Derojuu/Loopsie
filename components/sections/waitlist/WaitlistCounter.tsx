"use client";

import { useEffect, useRef } from "react";
import { COUNTER_DURATION } from "@/constants/waitlist";

interface WaitlistCounterProps {
  /** Final value (server-rendered so it is correct without JS). */
  value: number;
  /** Optional JSON endpoint returning `{ count: number }` (the original used `/api/users-count`). */
  endpoint?: string;
}

/** Big number that rolls up from 0 with a cubic ease-out, like the original `Counter` module. */
export function WaitlistCounter({ value, endpoint }: WaitlistCounterProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    let frame = 0;
    el.textContent = "0";

    const animate = (target: number) => {
      const start = performance.now();
      const step = (now: number) => {
        if (!alive) return;
        const t = Math.min((now - start) / COUNTER_DURATION, 1);
        el.textContent = String(Math.round(target * (1 - (1 - t) ** 3)));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const start = async () => {
      let target = value;
      if (endpoint) {
        try {
          const res = await fetch(endpoint, { headers: { accept: "application/json" } });
          if (res.ok) {
            const data: unknown = await res.json();
            const count = (data as { count?: unknown } | null)?.count;
            if (typeof count === "number") target = count;
          }
        } catch {
          /* keep the fallback */
        }
      }
      if (alive) animate(target);
    };
    start();

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      el.textContent = String(value);
    };
  }, [value, endpoint]);

  return (
    <p ref={ref} className="counter">
      {value}
    </p>
  );
}
