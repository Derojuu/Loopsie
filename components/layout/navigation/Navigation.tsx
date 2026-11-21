"use client";

import { useCallback, useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useLenis } from "@/components/providers/SmoothScroll";
import { useGsap } from "@/hooks/useGsap";
import { LINKS } from "@/constants/site";
import { MEDIA } from "@/constants/motion";
import { NAV_LINKS } from "@/constants/navigation";
import { NavLogo } from "./NavLogo";
import { NavPanel } from "./NavPanel";
import { NavLegal } from "./NavLegal";
import { WeightHoverLink } from "./WeightHoverLink";
import { setupNavMini, setupNavMorph, setupNavReveal } from "./navMotion";

const reducedMotion = () => window.matchMedia(MEDIA.reducedMotion).matches;

/**
 * Fixed site navigation. `--nav-inverse` (0..1) on the root `.nav` flips the
 * bar colours over dark sections; it is driven by the section that needs it.
 * Scrolling into the outro morphs the bar into the footer card + legal strip.
 */
export function Navigation() {
  const root = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGsap(
    (gsap) => {
      const nav = root.current;
      if (!nav) return;
      const cleanMini = setupNavMini(gsap, nav);
      const cleanMorph = setupNavMorph(gsap, nav);
      const cleanReveal = setupNavReveal(gsap, nav);
      return () => {
        cleanMini();
        cleanMorph();
        cleanReveal();
      };
    },
    root,
  );

  const scrollTo = useCallback(
    (target: HTMLElement | number, immediate = reducedMotion()) => {
      if (lenis) lenis.scrollTo(target, { immediate, force: true });
      else if (typeof target === "number") window.scrollTo({ top: target, behavior: immediate ? "instant" : "smooth" });
      else target.scrollIntoView({ behavior: immediate ? "instant" : "smooth" });
    },
    [lenis],
  );

  // Deep link (#features…) → jump there once, then clean the URL (original `fromHash`).
  useEffect(() => {
    const id = location.hash.slice(1);
    const target = NAV_LINKS.some((link) => link.id === id) && document.getElementById(id);
    if (!target) return;
    scrollTo(target, true);
    history.replaceState(null, "", location.pathname + location.search);
  }, [scrollTo]);

  const onLogo = (event: MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname !== "/") return;
    event.preventDefault();
    scrollTo(0);
  };

  const onLink = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    scrollTo(target);
  };

  return (
    <div
      ref={root}
      className="nav pointer-events-none fixed top-20 right-42 left-42 z-10 flex justify-center l:right-40 l:left-40 s:right-20 s:left-20"
      style={{ "--nav-inverse": 0 } as CSSProperties}
    >
      <div className="nav_slide flex w-full justify-center">
        <div className="nav_body pointer-events-auto">
          <div className="nav_bar w-full shrink-0 overflow-hidden">
            <div className="flex items-center justify-between py-13 pr-13 pl-25 l:py-5 l:pr-5 s:py-4 s:pr-4 s:pl-20">
              <a
                href={LINKS.home}
                data-track="nav-logo"
                className="nav_logo relative z-2 w-113 s:w-[calc(var(--spacing)*83.33)]"
                aria-label="Loopsii"
                onClick={onLogo}
              >
                <NavLogo />
              </a>
              <nav
                className="nav_links absolute top-1/2 left-1/2 z-2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-60 l:hidden"
                aria-label="Sections"
              >
                {NAV_LINKS.map((link) => (
                  <WeightHoverLink
                    key={link.id}
                    className="nav_link"
                    href={`#${link.id}`}
                    data-nav-link={link.id}
                    track={link.track}
                    label={link.label}
                    onClick={onLink(link.id)}
                  />
                ))}
              </nav>
              <div className="relative z-2">
                <Button track="nav-signup" />
              </div>
            </div>
          </div>
          <NavPanel />
        </div>
      </div>
      <NavLegal />
    </div>
  );
}
