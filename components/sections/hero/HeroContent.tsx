"use client";

import { useRef, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { useGsap } from "@/hooks/useGsap";
import { HERO_SUBTITLE } from "@/constants/hero";
import { HeroTitle } from "@/components/sections/hero/HeroTitle";
import { HeroShapes } from "@/components/sections/hero/HeroShapes";
import { HeroFrame } from "@/components/sections/hero/HeroFrame";
import { HeroGridCanvas } from "@/components/sections/hero/HeroGridCanvas";
import { HeroTitles } from "@/components/sections/hero/heroTitles";
import { HeroShapesController, createHeroGridState } from "@/components/sections/hero/heroShapesController";
import { useResizeKey } from "@/components/sections/hero/useResizeKey";

const isTouch = () => window.matchMedia("(hover: none) and (pointer: coarse)").matches;

/** The `.hero` stage: title, subtitle, shapes grid with its frame, and the WebGL grid layer. */
export function HeroContent() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [gridState] = useState(createHeroGridState);
  const resizeKey = useResizeKey();

  useGsap(
    (gsap) => {
      const hero = heroRef.current;
      if (!hero) return;

      const titles = new HeroTitles(gsap, hero);
      const shapes = new HeroShapesController(gsap, hero, gridState, () => titles.onStep());

      // Scroll-driven frame variables (`--hero-mask` lifts the bottom rows, `--reveal` opens the frame).
      const main = hero.closest("main") ?? document.body;
      const intro = document.querySelector(".intro");
      const scrub = isTouch() ? 0.1 : true;
      const travels = getComputedStyle(hero).getPropertyValue("--hero-travel").trim() !== "0";
      ScrollTrigger.create({
        trigger: main,
        start: "top top-=50",
        end: `+=${window.innerHeight * 0.8}`,
        scrub,
        animation: gsap.fromTo(hero, { "--hero-mask": 0 }, { "--hero-mask": 1, ease: "none" }),
      });
      ScrollTrigger.create({
        trigger: main,
        start: "top top-=50",
        ...(travels && intro
          ? { end: "bottom bottom+=150%", endTrigger: intro }
          : { end: `+=${window.innerHeight * 0.8}` }),
        scrub,
        animation: gsap.fromTo(hero, { "--reveal": 0 }, { "--reveal": 1, ease: "none" }),
      });
      ScrollTrigger.refresh();

      return () => {
        shapes.destroy();
        titles.destroy();
        ["--bottom-left", "--label-size", "height"].forEach((p) => hero.style.removeProperty(p));
      };
    },
    heroRef,
    [resizeKey, gridState],
  );

  return (
    <div ref={heroRef} className="hero h-(--screen-h) flex flex-col l:h-auto">
      <div className="hero_top grid main-grid pb-25 flex-none relative">
        <HeroTitle />
        <h2 className="text-xl hero_split col-span-4 self-end max-w-[20em] l:col-span-12 l:max-w-473">
          {HERO_SUBTITLE}
        </h2>
        <div className="hero_top-line absolute bottom-0 left-ncont right-ncont h-px bg-border" />
      </div>
      <div className="hero_bottom-wrapper grow grid main-grid relative l:pt-95 s:pt-55">
        <div className="hero_bottom self-end col-span-10 col-start-2 relative l:col-span-12 l:col-start-1">
          <div className="hero_grid grid-lines" aria-hidden="true" />
          <HeroShapes />
          <HeroFrame />
        </div>
      </div>
      <HeroGridCanvas state={gridState} />
    </div>
  );
}
