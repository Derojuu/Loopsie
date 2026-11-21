"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { FeatureIconId } from "@/constants/features";
import { MEDIA } from "@/constants/motion";
import { registerGsap } from "@/lib/gsap";
import { createFeatureIconAnimation } from "@/components/sections/features/featureIconAnimations";

interface FeatureVisualProps {
  icon: FeatureIconId;
  /** Width in design pixels. */
  width: number;
  /** The icon's inline SVG. */
  children: ReactNode;
}

/** Sized icon slot that loops the icon's animation while it is on screen. */
export function FeatureVisual({ icon, width, children }: FeatureVisualProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = ref.current?.querySelector("svg");
    if (!svg || window.matchMedia(MEDIA.reducedMotion).matches) return;

    const tl = createFeatureIconAnimation(registerGsap(), icon, svg);
    if (!tl) return;
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? tl.play() : tl.pause()), {
      rootMargin: "50px 0px",
    });
    observer.observe(svg);
    return () => {
      observer.disconnect();
      tl.kill();
    };
  }, [icon]);

  return (
    <div ref={ref} className="features_icon mt-auto max-w-full" style={{ "--icon-w": width } as CSSProperties}>
      {children}
    </div>
  );
}
