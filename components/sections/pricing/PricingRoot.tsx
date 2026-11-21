"use client";

import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MEDIA } from "@/constants/motion";
import { PRICING_PLAN_IDS, PRICING_PLANS, type PricingPlanId } from "@/constants/pricing";
import { PaperCurl } from "@/components/sections/pricing/paperCurl";

interface PricingContextValue {
  plan: PricingPlanId;
  select: (plan: PricingPlanId) => void;
  peek: (on: boolean) => void;
}

const PricingContext = createContext<PricingContextValue | null>(null);

export function usePricing(): PricingContextValue {
  const value = use(PricingContext);
  if (!value) throw new Error("usePricing must be used inside <PricingRoot>");
  return value;
}

/** Same media query as the original `touchScroll` helper. */
const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";

/**
 * `<section id="pricing">` shell: owns the selected plan and the WebGL paper
 * sheets (`is-gl` hides the DOM price layers once the GL sheets are live,
 * `is-yearly` mirrors the selected plan).
 */
export function PricingRoot({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const fixedCanvasRef = useRef<HTMLCanvasElement>(null);
  const stageCanvasRef = useRef<HTMLCanvasElement>(null);
  const paperRef = useRef<PaperCurl | null>(null);
  const [plan, setPlan] = useState<PricingPlanId>("monthly");
  const planRef = useRef<PricingPlanId>("monthly");

  useEffect(() => {
    sectionRef.current?.classList.toggle("is-yearly", plan === "yearly");
  }, [plan]);

  useEffect(() => {
    const section = sectionRef.current;
    const sheet = section?.querySelector<HTMLElement>("[data-pricing-sheet]");
    if (!section || !sheet || window.matchMedia(MEDIA.reducedMotion).matches) return;
    const inflow = window.matchMedia(TOUCH_QUERY).matches;
    const canvas = inflow ? stageCanvasRef.current : fixedCanvasRef.current;
    if (!canvas) return;
    const paper = PaperCurl.create({
      section,
      sheet,
      canvas,
      plans: PRICING_PLAN_IDS.map((id) => PRICING_PLANS[id]),
      inflow,
    });
    if (!paper) return;
    paperRef.current = paper;
    section.classList.add("is-gl");
    return () => {
      paper.destroy();
      paperRef.current = null;
      section.classList.remove("is-gl");
    };
  }, []);

  const select = useCallback((next: PricingPlanId) => {
    if (planRef.current === next) return;
    planRef.current = next;
    setPlan(next);
    paperRef.current?.flip(PRICING_PLAN_IDS.indexOf(next));
  }, []);

  const peek = useCallback((on: boolean) => {
    if (window.matchMedia(MEDIA.finePointer).matches) paperRef.current?.peek(on);
  }, []);

  const value = useMemo(() => ({ plan, select, peek }), [plan, select, peek]);

  return (
    <PricingContext value={value}>
      <section ref={sectionRef} id="pricing" className="pricing relative z-3 py-section s:py-80" data-pricing>
        <canvas
          ref={fixedCanvasRef}
          className="pricing_canvas pointer-events-none fixed inset-0 z-10"
          data-pricing-canvas
          aria-hidden="true"
        />
        <canvas
          ref={stageCanvasRef}
          className="pricing_canvas pointer-events-none absolute top-0 left-0 z-10"
          data-pricing-stage
          aria-hidden="true"
        />
        {children}
      </section>
    </PricingContext>
  );
}
