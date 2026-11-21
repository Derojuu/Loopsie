"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { useGsap } from "@/hooks/useGsap";
import { useLenis } from "@/components/providers/SmoothScroll";
import { isLoaderHeld } from "@/lib/loader-events";
import { PageLoader, forceFinish } from "./loaderMotion";

/** Total time budget for loading before the loader is dismissed (ms since navigation start). */
const MAX_WAIT = 6000;
/** Hard stop: if the loader has not started its exit by then, release the page. */
const SAFETY_MS = 8000;

const frames = (count: number): Promise<void> =>
  new Promise((resolve) => {
    const tick = (left: number) => (left ? requestAnimationFrame(() => tick(left - 1)) : resolve());
    tick(count);
  });

const windowLoaded = (): Promise<void> =>
  document.readyState === "complete"
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener("load", () => resolve(), { once: true }));

/** Decodes the images already in view so the reveal does not stutter. */
const decodeVisibleImages = (main: HTMLElement): Promise<unknown> =>
  Promise.allSettled(
    [...main.querySelectorAll<HTMLImageElement>("img")]
      .filter((img) => img.loading !== "lazy" && img.getClientRects().length > 0 && img.getBoundingClientRect().top < window.innerHeight)
      .map((img) => img.decode()),
  );

/** Client brain of the page loader: counts progress, waits for the page, then runs the exit. */
export function LoaderController() {
  const scope = useRef<Element | null>(null);
  const lenis = useLenis();
  const lenisRef = useRef(lenis);

  // Keep scrolling locked while the loader is up (Lenis may mount after us).
  useEffect(() => {
    lenisRef.current = lenis;
    if (lenis && isLoaderHeld()) lenis.stop();
  }, [lenis]);

  useGsap((gsap) => {
    const instance = document.querySelector<HTMLElement>("[data-loader]");
    if (!instance || instance.hidden) return;
    history.scrollRestoration = "manual";
    const getLenis = () => lenisRef.current;
    getLenis()?.stop();

    let loader: PageLoader;
    try {
      loader = new PageLoader(gsap, instance, getLenis);
    } catch (error) {
      console.warn("Loader failed", error);
      forceFinish(getLenis);
      return;
    }

    let cancelled = false;
    const safety = window.setTimeout(() => {
      if (!cancelled) {
        loader.destroy();
        forceFinish(getLenis);
      }
    }, SAFETY_MS);

    const run = async () => {
      const main = document.querySelector<HTMLElement>("main")!;
      void loader.setWork(0.35);
      await document.fonts.ready;
      void loader.setWork(0.75);
      main.style.visibility = "visible";
      await loader.warm();
      void loader.setWork(0.9);
      const cap = new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, MAX_WAIT - performance.now())));
      await Promise.race([windowLoaded(), cap]);
      await Promise.race([decodeVisibleImages(main), cap]);
      ScrollTrigger.refresh();
      await frames(2);
      await loader.setWork(1);
      if (cancelled) return;
      window.clearTimeout(safety);
      // The exit can legitimately take a few seconds; guard it separately.
      const exitGuard = window.setTimeout(() => {
        loader.destroy();
        forceFinish(getLenis);
      }, SAFETY_MS + 4000);
      try {
        await loader.exit();
      } finally {
        window.clearTimeout(exitGuard);
      }
    };

    run().catch((error) => {
      console.warn("Loader failed", error);
      if (!cancelled) forceFinish(getLenis);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(safety);
      loader.destroy();
    };
  }, scope);

  return null;
}
