"use client";

import { useRef, type CSSProperties } from "react";
import { useGsap } from "@/hooks/useGsap";
import { ScrollTrigger } from "@/lib/gsap";
import {
  DISTRACTION_MIN_TAG_SCALE,
  DISTRACTION_NAV_PAD,
  DISTRACTION_STAGGER_FROM,
  DISTRACTION_SUBTITLE,
  DISTRACTION_TAGS,
  DISTRACTION_TITLE,
} from "@/constants/distraction";
import { DistractionPhoto } from "@/components/sections/distraction/DistractionPhoto";

const FRAME_LINES = [
  "-right-1/2 -left-1/2 top-0 absolute h-px bg-current/20",
  "-right-1/2 -left-1/2 bottom-0 absolute h-px bg-current/20",
  "-top-[100vh] -bottom-[100vh] left-0 absolute w-px bg-current/20",
  "-top-[100vh] -bottom-[100vh] right-0 absolute w-px bg-current/20",
  "absolute left-0 top-0 -ml-4 -mt-4 size-8 bg-current s:-ml-3 s:-mt-3 s:size-6",
  "absolute right-0 top-0 -mr-4 -mt-4 size-8 bg-current s:-mr-3 s:-mt-3 s:size-6",
  "absolute right-0 bottom-0 -mr-4 -mb-4 size-8 bg-current s:-mr-3 s:-mb-3 s:size-6",
  "absolute left-0 bottom-0 -ml-4 -mb-4 size-8 bg-current s:-ml-3 s:-mb-3 s:size-6",
] as const;

const TAG_CLASS =
  "inner-tag flex h-60 items-center justify-center whitespace-nowrap rounded-full border border-black bg-grey px-30 text-tag font-semibold text-black l:h-50 l:px-25 s:h-32 s:px-14";

/** `(hover: none) and (pointer: coarse)` — the original `touchScroll` check. */
const isTouch = () => window.matchMedia("(hover: none) and (pointer: coarse)").matches;

/**
 * Three-screen sticky section: the framed title expands to the viewport edges
 * while the parentheses open and the distraction tags pop in between them.
 */
export function Distraction() {
  const root = useRef<HTMLElement>(null);

  useGsap(
    (gsap) => {
      const instance = root.current;
      if (!instance) return;
      const wrapper = instance.querySelector<HTMLElement>(".distraction_wrapper")!;
      const container = wrapper;
      const titleWrapper = instance.querySelector<HTMLElement>(".title_wrapper")!;
      const titles = [...titleWrapper.querySelectorAll<HTMLElement>("p")];
      const parenthesis = [...instance.querySelectorAll<HTMLElement>(".parenthesis")];
      const tags = [...instance.querySelectorAll<HTMLElement>(".inner-tag")];
      const tagsWrapper = instance.querySelector<HTMLElement>(".distraction_tags")!;
      const overlay = document.querySelector<HTMLElement>(".intro_overlay");
      const nav = document.querySelector<HTMLElement>(".nav");
      const navBar = nav?.querySelector<HTMLElement>(".nav_bar") ?? null;

      let triggers: ScrollTrigger[] = [];
      let timelines: gsap.core.Timeline[] = [];
      let inverse: number | undefined;
      let invertFrame = 0;
      let navEnter: ScrollTrigger | undefined;
      let navLeave: ScrollTrigger | undefined;

      const navBand = () => {
        const top = nav?.offsetTop ?? 0;
        return { top, bottom: top + (navBar?.offsetHeight ?? 0) };
      };

      const cover = () => {
        if (!navBar) return 0;
        const t = navBar.getBoundingClientRect();
        const n = wrapper.getBoundingClientRect();
        const r = Math.min(t.bottom, n.bottom) - Math.max(t.top, n.top);
        return gsap.utils.clamp(0, 1, r / t.height);
      };

      const invert = () => {
        if (invertFrame) return;
        invertFrame = requestAnimationFrame(() => {
          invertFrame = 0;
          const e = navEnter?.progress ?? 0;
          const t = navLeave?.progress ?? 0;
          const n = (e > 0 && e < 1) || (t > 0 && t < 1) ? cover() : +(e === 1 && t === 0);
          const r = Math.round(n * 1e3) / 1e3;
          if (r !== inverse) {
            inverse = r;
            nav?.style.setProperty("--nav-inverse", String(r));
          }
        });
      };

      const fitTags = () => {
        tagsWrapper.style.removeProperty("--spacing");
        if (!window.matchMedia("(min-width: 1024px)").matches) return;
        const pad = (gsap.getProperty(container, "paddingLeft") as number) * 2;
        const fontSize = gsap.getProperty(titles[0], "fontSize") as number;
        const rem = parseFloat(getComputedStyle(document.body).fontSize) / 16;
        const max = window.innerHeight - 40 * rem;
        let scale = 1;
        for (let i = 0; i < 3 && scale > DISTRACTION_MIN_TAG_SCALE; i++) {
          const tagsH = tagsWrapper.getBoundingClientRect().height - tags[0].getBoundingClientRect().height * 2;
          const total = tagsH + titleWrapper.getBoundingClientRect().height + pad - fontSize * 0.2;
          if (total <= max) return;
          scale = Math.max(DISTRACTION_MIN_TAG_SCALE, (scale * (tagsH - (total - max))) / tagsH);
          tagsWrapper.style.setProperty("--spacing", `calc(var(--size-font) / var(--size-unit) * ${scale})`);
        }
      };

      const kill = () => {
        triggers.forEach((t) => t.kill());
        timelines.forEach((t) => t.kill());
        triggers = [];
        timelines = [];
        navEnter = navLeave = undefined;
      };

      const build = () => {
        kill();
        gsap.set(wrapper, { "--intro": 1, "--leave": 0 });
        const moving = [...titles, ...titleWrapper.querySelectorAll<HTMLElement>(":scope > .pointer-events-none > div")];
        gsap.set([...tags, ...parenthesis], { clearProps: "transform,opacity,visibility" });
        gsap.set(moving, { clearProps: "transform" });
        gsap.set(titleWrapper, { width: "auto", height: "auto" });
        fitTags();

        const from = moving.map((el) => el.getBoundingClientRect());
        const pad = (gsap.getProperty(container, "paddingLeft") as number) * 2;
        const inset = pad * (parseFloat(getComputedStyle(wrapper).getPropertyValue("--frame-inset")) || 1);
        const fontSize = gsap.getProperty(titles[0], "fontSize") as number;
        const p0 = parenthesis[0].parentElement!.getBoundingClientRect();
        const gap = parenthesis[1].parentElement!.getBoundingClientRect().left - p0.right;
        const tagsH = tagsWrapper.getBoundingClientRect().height;
        const phone = window.matchMedia("(max-width: 479px)").matches;
        const height = phone
          ? tagsH + titles.reduce((sum, t) => sum + t.getBoundingClientRect().height, 0) + pad + fontSize * 2.2
          : tagsH + titleWrapper.getBoundingClientRect().height + pad - tags[0].getBoundingClientRect().height * 2 - fontSize * 0.2;
        gsap.set(titleWrapper, { width: window.innerWidth - inset, height });
        const to = moving.map((el) => el.getBoundingClientRect());

        const tl = gsap.timeline({ paused: true, defaults: { ease: "power4", force3D: true } });
        tl.fromTo(moving, { x: (i) => from[i].left - to[i].left, y: (i) => from[i].top - to[i].top }, { x: 0, y: 0 });
        tl.fromTo(
          parenthesis[0],
          { x: "0px", y: "0px" },
          {
            x: `${tags[0].getBoundingClientRect().left - p0.left - p0.width - gap}px`,
            y: `${-tagsWrapper.getBoundingClientRect().height / 2 + fontSize * 0.38}px`,
          },
          "<",
        );
        tl.fromTo(
          parenthesis[1],
          { x: "0px", y: "0px" },
          {
            x: `${tags[tags.length - 1].getBoundingClientRect().right + gap - parenthesis[1].parentElement!.getBoundingClientRect().left}px`,
            y: `${tagsWrapper.getBoundingClientRect().height / 2 - fontSize * 0.38}px`,
          },
          "<",
        );
        const fromIndex = tags.findIndex((t) => t.textContent?.includes(DISTRACTION_STAGGER_FROM));
        tl.fromTo(
          tags,
          { opacity: 0, scale: 0.01, force3D: true },
          {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: "back(1.2)",
            stagger: { each: 0.02, from: fromIndex >= 0 ? fromIndex : "center" },
          },
          "<",
        );

        const scrub = !isTouch() || 0.1;
        const scroll = ScrollTrigger.create({
          trigger: instance,
          start: "top top",
          end: phone ? "bottom bottom" : "bottom bottom+=50%",
          scrub,
          animation: tl,
        });

        const leaveTl = gsap.timeline({ paused: true, defaults: { ease: "none", duration: 1 } });
        leaveTl.fromTo(wrapper, { "--leave": 0 }, { "--leave": 1 });
        const leaveScroll = ScrollTrigger.create({
          trigger: instance,
          start: "bottom bottom",
          end: "+=100%",
          scrub,
          animation: leaveTl,
        });

        const revealTl = gsap.timeline({ paused: true, defaults: { ease: "none", duration: 1 } });
        revealTl.fromTo(wrapper, { "--intro": 0 }, { "--intro": 1 });
        if (overlay) revealTl.fromTo(overlay, { "--progress": 0 }, { "--progress": 0.6, duration: 0.6 }, "<");

        const m = 1.05;
        const h = (v: number) => window.innerHeight - (window.innerHeight - v) / m;
        navEnter = ScrollTrigger.create({
          trigger: instance,
          start: () => `top ${(navBand().bottom + DISTRACTION_NAV_PAD) / m}`,
          end: () => `top ${(navBand().top - DISTRACTION_NAV_PAD) / m}`,
          onUpdate: invert,
          onRefresh: invert,
        });
        navLeave = ScrollTrigger.create({
          trigger: instance,
          start: () => `bottom ${h(navBand().bottom + DISTRACTION_NAV_PAD)}`,
          end: () => `bottom ${h(navBand().top - DISTRACTION_NAV_PAD)}`,
          onUpdate: invert,
          onRefresh: invert,
        });
        invert();

        const revealScroll = ScrollTrigger.create({
          trigger: instance,
          start: "top bottom",
          end: "top top",
          scrub,
          animation: revealTl,
        });

        triggers = [scroll, leaveScroll, navEnter, navLeave, revealScroll];
        timelines = [tl, leaveTl, revealTl];
      };

      build();

      let lastWidth = window.innerWidth;
      let resizeTimer = 0;
      const onResize = () => {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          build();
          ScrollTrigger.refresh();
        }, 150);
      };
      window.addEventListener("resize", onResize);
      document.fonts?.ready.then(() => {
        if (!instance.isConnected) return;
        build();
        ScrollTrigger.refresh();
      });

      return () => {
        window.removeEventListener("resize", onResize);
        window.clearTimeout(resizeTimer);
        cancelAnimationFrame(invertFrame);
        kill();
        nav?.style.removeProperty("--nav-inverse");
      };
    },
    root,
  );

  return (
    <section
      ref={root}
      className="distraction relative z-3 flex flex-col overflow-clip h-[calc(var(--screen-h)*3)] -mt-(--screen-h) z-2 l:mt-0 s:h-[calc(var(--screen-h)*2.3)]"
    >
      <div
        className="container max-w-none distraction_wrapper sticky top-0 h-(--screen-h) h2 flex justify-center items-center bg-black text-grey px-cont"
        style={{ "--leave": 0, "--intro": 0 } as CSSProperties}
      >
        <DistractionPhoto />
        <div className="title_wrapper flex flex-col justify-between relative p-40 min-w-1220 l:p-20 l:min-w-600 s:min-w-0">
          <p className="h2 max-w-510 self-start s:max-w-260">{DISTRACTION_TITLE}</p>
          <p className="h2 max-w-563 self-end text-right -mt-[1em] l:mt-120 s:mt-40 s:max-w-290">{DISTRACTION_SUBTITLE}</p>
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {FRAME_LINES.map((cls) => (
              <div key={cls} className={cls} />
            ))}
          </div>
        </div>
        <div className="flex items-stretch justify-center gap-10 self-center absolute left-1/2 top-1/2 -translate-1/2 l:w-600 s:w-286">
          <div className="parenthesis_parent absolute left-1/2 top-1/2 -translate-1/2 flex gap-20 s:gap-8" aria-hidden="true">
            <div className="parenthesis_wrapper">
              <span className="block parenthesis">(</span>
            </div>
            <div className="parenthesis_wrapper">
              <span className="block parenthesis">)</span>
            </div>
          </div>
          <ul className="distraction_tags flex max-w-818 flex-wrap justify-center gap-10 l:max-w-600 s:max-w-286 s:gap-4">
            {DISTRACTION_TAGS.map((tag) => (
              <li key={tag} className={TAG_CLASS}>
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
