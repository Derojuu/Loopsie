"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { FEATURES_INITIAL_OPEN } from "@/constants/features";
import { MEDIA } from "@/constants/motion";
import { getNavRoom, useAccordion } from "@/hooks/useAccordion";
import { useGsap } from "@/hooks/useGsap";
import { useLenis } from "@/components/providers/SmoothScroll";
import { registerGsap, ScrollTrigger } from "@/lib/gsap";

interface FeaturesAccordion {
  openIndex: number | null;
  toggle: (index: number) => void;
}

const FeaturesAccordionContext = createContext<FeaturesAccordion>({ openIndex: null, toggle: () => {} });

export const useFeaturesAccordion = () => useContext(FeaturesAccordionContext);

/** Cards fly up out of the page (rotationX/z) — shared by scroll entrance and mobile reveal. */
const CARD_FROM = { rotationX: -65, z: -500, opacity: 0 };
const CARD_TO = { rotationX: 0, z: 0, opacity: 1, duration: 0.9, ease: "power3.out" };

/**
 * Phase list wrapper: owns the mobile accordion (single-open, ≤1023px only)
 * and the desktop scroll-in of every card (port of the `features` home module).
 */
export function FeaturesList({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  const items = () => [...(ref.current?.querySelectorAll<HTMLElement>(".features_item") ?? [])];

  const accordion = useAccordion(FEATURES_INITIAL_OPEN, {
    enabled: () => window.matchMedia(MEDIA.tablet).matches,
    refreshDelay: 650,
    onBeforeOpen: (index, previous) => {
      const list = items();
      const item = list[index];
      if (!item) return;
      const shift =
        previous !== null && previous < index
          ? (list[previous].querySelector<HTMLElement>(".features_body")?.offsetHeight ?? 0)
          : 0;
      const gap = (parseFloat(getComputedStyle(document.body).fontSize) / 16) * 20;
      const y = item.getBoundingClientRect().top + window.scrollY - shift - getNavRoom() - gap;
      lenis?.scrollTo(y, { duration: 0.6 });
    },
    onOpen: (index) => {
      const cards = items()[index]?.querySelectorAll(".features_card");
      if (!cards?.length) return;
      registerGsap().fromTo(cards, CARD_FROM, {
        ...CARD_TO,
        stagger: 0.05,
        overwrite: true,
        clearProps: "transform,opacity",
      });
    },
  });

  useGsap(
    (gsap) => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.desktop, () => {
        const root = ref.current;
        if (!root) return;
        const cards = root.querySelectorAll(".features_card");
        gsap.set(cards, { transformOrigin: "top center" });
        root.querySelectorAll(".features_grid").forEach((grid) => {
          gsap.set(grid, { perspective: 900 });
          grid.querySelectorAll(".features_card").forEach((card, n) => {
            ScrollTrigger.create({
              trigger: card,
              start: "top bottom",
              onEnter: () => {
                gsap.set(card, CARD_FROM);
                gsap.to(card, { ...CARD_TO, delay: (n % 3) * 0.05 });
              },
            });
          });
        });
        return () => {
          gsap.killTweensOf(cards);
          gsap.set(cards, { clearProps: "transform,opacity" });
        };
      });
      return () => mm.revert();
    },
    ref,
  );

  return (
    <FeaturesAccordionContext.Provider value={accordion}>
      <div ref={ref} className="flex flex-col gap-40">
        {children}
      </div>
    </FeaturesAccordionContext.Provider>
  );
}
