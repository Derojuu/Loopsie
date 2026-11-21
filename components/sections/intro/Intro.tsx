"use client";

import { useEffect, useId, useRef } from "react";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "@/lib/gsap";
import { useGsap } from "@/hooks/useGsap";
import { useLenis } from "@/components/providers/SmoothScroll";
import { getRevealLines, RevealText } from "@/components/ui/RevealText";
import { useResizeKey } from "@/components/sections/hero/useResizeKey";
import { IntroMark } from "@/components/sections/intro/IntroMark";
import { IntroOrbitItem } from "@/components/sections/intro/IntroOrbitItem";
import { MEDIA } from "@/constants/motion";
import { INTRO_LABEL, INTRO_MOTION, INTRO_NOTE, INTRO_ORBIT_ITEMS, INTRO_TITLE } from "@/constants/intro";
import type { CSSProperties } from "react";

const isTouch = () => window.matchMedia("(hover: none) and (pointer: coarse)").matches;

/**
 * "What is Loopsii" — sticky statement section. The coral logo starts inside
 * the hero's centre cell and travels down/grows into place while scrolling,
 * the statement reveals word-by-word, then feature bubbles pop in and orbit it.
 */
export function Intro() {
  const sectionRef = useRef<HTMLElement>(null);
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  const resizeKey = useResizeKey();
  const pathId = `intro-orbit-path-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useGsap(
    (gsap) => {
      gsap.registerPlugin(MotionPathPlugin);
      const section = sectionRef.current;
      if (!section) return;
      const q = <T extends Element>(selector: string) => section.querySelector<T>(selector)!;
      const hero = document.querySelector<HTMLElement>(".hero");
      const heroSpot = hero?.querySelector<HTMLElement>(".hero-el_loop") ?? null;
      const main = section.closest("main") ?? document.body;
      const logo = q<HTMLElement>(".intro_logo");
      const logoParent = logo.parentElement!;
      const title = q<HTMLElement>("h2");
      const label = q<HTMLElement>(".intro_label");
      const note = q<HTMLElement>(".intro_note");
      const path = q<SVGPathElement>(".intro-orbit_track path");
      const orbitItems = [...section.querySelectorAll<HTMLElement>(".intro-orbit_item")];
      const velocity = () => Math.abs(lenisRef.current?.velocity ?? 0);

      // Shrink the orbit (via the parent's --spacing) so it fits below the statement on short screens.
      const fitOrbit = () => {
        logoParent.style.removeProperty("--spacing");
        if (!window.matchMedia(MEDIA.desktop).matches) return;
        const sticky = logoParent.closest<HTMLElement>(".intro_sticky");
        const first = sticky?.firstElementChild as HTMLElement | null;
        const track = logoParent.querySelector(".intro-orbit_track");
        if (!sticky || !first || !track) return;
        const tallest = Math.max(...orbitItems.map((item) => item.offsetHeight));
        const needed = track.getBoundingClientRect().height + tallest * 1.1;
        const room =
          window.innerHeight - first.offsetTop - first.offsetHeight - parseFloat(getComputedStyle(sticky).paddingBottom);
        const rem = parseFloat(getComputedStyle(document.body).fontSize) / 16;
        const ratio = Math.max(INTRO_MOTION.minOrbitScale, Math.min(1, (room - 20 * rem) / needed));
        if (ratio < 1) logoParent.style.setProperty("--spacing", `calc(var(--size-font) / var(--size-unit) * ${ratio})`);
      };
      fitOrbit();

      const travels = !!hero && !!heroSpot && getComputedStyle(hero).getPropertyValue("--hero-travel").trim() !== "0";

      // Logo travels from the hero's loop cell (scaled to its size) to its own spot.
      const setScaleX = gsap.quickSetter(logo, "scaleX");
      const setScaleY = gsap.quickSetter(logo, "scaleY");
      const setY = gsap.quickSetter(logo, "y", "px");
      const updateLogoMove = (progress: number) => {
        let scale = 1;
        let y = 0;
        if (travels && heroSpot) {
          const spot = heroSpot.getBoundingClientRect();
          const own = logoParent.getBoundingClientRect();
          scale = spot.height / own.height;
          y = spot.top + spot.height / 2 - (own.top + own.height / 2);
        }
        const s = gsap.utils.interpolate(scale, 1, progress);
        setScaleX(s);
        setScaleY(s);
        setY(gsap.utils.interpolate(y, 0, progress));
      };
      updateLogoMove(0);
      ScrollTrigger.create({
        trigger: main,
        start: "top top-=50",
        ...(travels ? { end: "bottom bottom+=150%", endTrigger: section } : { end: `+=${window.innerHeight * 0.8}` }),
        scrub: isTouch() ? 0.1 : true,
        onUpdate: (self) => updateLogoMove(self.progress),
        onRefresh: (self) => updateLogoMove(self.progress),
      });

      // Label + statement word reveal.
      const { revealEase, revealStagger, lineOffset } = INTRO_MOTION;
      const groups = [getRevealLines(label), getRevealLines(title)];
      gsap.set(groups.flat(2), { x: 0, y: 0, yPercent: 110 });
      const titleRevealTl = gsap.timeline({ paused: true, defaults: { ease: revealEase, duration: 1 } });
      groups.forEach((lines) =>
        lines.forEach((words, i) => titleRevealTl.to(words, { yPercent: 0, stagger: revealStagger }, i * lineOffset)),
      );
      const logoHeight = logoParent.getBoundingClientRect().height;
      ScrollTrigger.create({
        trigger: title,
        start: travels ? `bottom center+=${logoHeight * 0.3}px` : "top 85%",
        onEnter: () => {
          titleRevealTl.timeScale(1).play();
        },
        onLeaveBack: () => {
          if (!travels) return;
          titleRevealTl.timeScale(gsap.utils.mapRange(0, 30, 1.75, 3, velocity())).reverse();
        },
      });

      // Orbit loop (40s per lap, evenly spaced along the circle).
      let orbitTl: gsap.core.Timeline | null = null;
      gsap.set(orbitItems, { clearProps: "transform" });
      const orbitMM = gsap.matchMedia();
      orbitMM.add("(prefers-reduced-motion: no-preference)", () => {
        orbitTl = gsap.timeline({ paused: true });
        orbitItems.forEach((item, i) => {
          orbitTl!.to(
            item,
            {
              duration: INTRO_MOTION.orbitDuration,
              ease: "none",
              repeat: -1,
              motionPath: {
                path,
                align: path,
                alignOrigin: [0.5, 0.5],
                autoRotate: false,
                start: i / orbitItems.length,
                end: i / orbitItems.length + 1,
              },
            },
            0,
          );
        });
        return () => {
          orbitTl?.kill();
          orbitTl = null;
        };
      });

      // Bubbles pop in, then the note reveals.
      const orbitsRevealTl = gsap.timeline({
        paused: true,
        defaults: { ease: INTRO_MOTION.orbitEase, duration: 1 },
        onStart: () => {
          orbitTl?.play();
        },
        onReverseComplete: () => {
          orbitTl?.pause();
        },
      });
      orbitsRevealTl.fromTo(orbitItems, { scale: 0 }, { scale: 1, stagger: INTRO_MOTION.orbitStagger });
      const noteLines = getRevealLines(note);
      gsap.set(noteLines.flat(), { x: 0, y: 0, yPercent: 110 });
      noteLines.forEach((words, i) =>
        orbitsRevealTl.to(
          words,
          { yPercent: 0, ease: revealEase, stagger: revealStagger },
          INTRO_MOTION.noteOffset + i * lineOffset,
        ),
      );
      ScrollTrigger.create({
        trigger: travels ? section : logoParent,
        start: travels ? `bottom bottom+=${window.innerHeight * 1.5 - logoHeight * 0.2}px` : "top 85%",
        onEnter: () => {
          orbitsRevealTl.timeScale(1).play();
        },
        onLeaveBack: () => {
          if (!travels) return;
          orbitsRevealTl.timeScale(gsap.utils.mapRange(0, 30, 1.5, 4, velocity())).reverse();
        },
      });

      return () => {
        orbitMM.revert();
        gsap.set(logo, { clearProps: "transform" });
        logoParent.style.removeProperty("--spacing");
      };
    },
    sectionRef,
    [resizeKey],
  );

  return (
    <section ref={sectionRef} className="intro relative z-2 flex">
      <div className="container max-w-none relative h-[calc(var(--screen-h)*2.5)] l:h-auto px-cont">
        <div className="intro_sticky flex flex-col min-h-(--screen-h) justify-between pb-100 sticky top-0">
          <div className="grid main-grid items-start gap-y-30 s:gap-y-20">
            <RevealText
              as="p"
              text={INTRO_LABEL}
              className="intro_label col-span-3 text-note font-hand leading-1.5 l:col-span-12"
            />
            <RevealText
              as="h2"
              text={INTRO_TITLE}
              className="h3 col-start-5 col-span-8 l:col-span-12 l:col-start-1 [font-variation-settings:'wght'_500]!"
            />
          </div>
          <div className="intro_stage grid main-grid grow items-center">
            <div className="col-start-5 col-span-4 flex justify-center items-center s:col-span-12 s:col-start-1">
              <div className="intro_logo-parent relative w-216 h-216 flex justify-center items-center">
                <div className="intro_logo relative z-1 w-full aspect-square rounded-full flex justify-center items-center">
                  <div className="intro_logo-bg absolute inset-0 -z-1 rounded-full bg-coral" />
                  <div className="intro_mark">
                    <IntroMark />
                  </div>
                  <svg
                    className="intro-orbit_track absolute left-1/2 top-1/2 pointer-events-none size-390 -translate-x-1/2 -translate-y-1/2"
                    viewBox="0 0 390 390"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path id={pathId} d="M0,195 a195,195 0 1,0 390,0 a195,195 0 1,0 -390,0" />
                  </svg>
                  {INTRO_ORBIT_ITEMS.map((item, i) => (
                    <IntroOrbitItem key={i} item={item} />
                  ))}
                </div>
              </div>
            </div>
            <RevealText
              as="p"
              text={INTRO_NOTE}
              className="intro_note max-w-[26ch] col-start-9 col-span-4 text-xl l:col-span-9 l:col-start-4 l:max-w-483 s:col-span-12 s:col-start-1 s:max-w-none"
            />
          </div>
          <div
            className="intro_overlay absolute pointer-events-none inset-y-0 -inset-x-cont z-2"
            style={{ "--progress": 0 } as CSSProperties}
          />
        </div>
      </div>
    </section>
  );
}
