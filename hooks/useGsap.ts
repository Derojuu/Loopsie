"use client";

import { type DependencyList, type RefObject } from "react";
import { registerGsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

/**
 * Runs GSAP setup inside a `gsap.context` scoped to `scope`, reverting every
 * tween / ScrollTrigger created in it on unmount or when deps change.
 */
export function useGsap(
  setup: (gsap: ReturnType<typeof registerGsap>) => void | (() => void),
  scope: RefObject<Element | null>,
  deps: DependencyList = [],
): void {
  useIsomorphicLayoutEffect(() => {
    const gsap = registerGsap();
    let cleanup: void | (() => void);
    const ctx = gsap.context(() => {
      cleanup = setup(gsap);
    }, scope.current ?? undefined);
    return () => {
      cleanup?.();
      ctx.revert();
    };
  }, deps);
}
