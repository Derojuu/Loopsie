"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type Lenis from "lenis";
import { useGsap } from "@/hooks/useGsap";
import { useLenis } from "@/components/providers/SmoothScroll";
import { ScrollTrigger } from "@/lib/gsap";
import { ROADMAP_FIT_MARGIN, ROADMAP_GLOW, ROADMAP_GRID } from "@/constants/roadmap";
import { RoadmapSnap } from "@/components/sections/roadmap/roadmapSnap";

const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";

type Rgb = [number, number, number];

const px = (value: string) => parseFloat(value) || 0;

/**
 * Client shell of the roadmap: renders the `<section>` and drives the wheel
 * (`--wheel`), the ring glow (`--lit`, `--lit-color`, gradient span), the
 * runtime `--hang` / height measurements and the idle snap to each card.
 */
export function RoadmapMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const lenis = useLenis();
  const lenisRef = useRef<Lenis | null>(lenis);

  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useGsap(
    (gsap) => {
      const section = root.current;
      const wheel = section?.querySelector<HTMLElement>(".roadmap_wheel");
      const cards = section ? [...section.querySelectorAll<HTMLElement>(".roadmap_card")] : [];
      if (!section || !wheel || cards.length < 2) return;

      const touch = window.matchMedia(TOUCH_QUERY).matches;
      const pin = section.querySelector<HTMLElement>(".roadmap_pin")!;
      const intro = section.querySelector<HTMLElement>(".roadmap_intro");
      const stage = wheel.parentElement as HTMLElement;
      const rings = [...section.querySelectorAll<SVGSVGElement>(".roadmap_ring")];
      const last = cards.length - 1;

      let tl: gsap.core.Timeline | null = null;
      let trigger: ScrollTrigger | null = null;
      let ring: SVGSVGElement | undefined;
      let gradient: SVGLinearGradientElement | null | undefined;
      let center = 0;
      let radius = 0;
      let half = 0;
      let tones: Rgb[] = [];
      let tone: Rgb = [0, 0, 0];
      let glow = 0;
      let k: number | undefined;
      let aim: number | undefined;
      let lit: string | null = null;
      let tint: string | null = null;
      let spinning = false;
      let ticking = false;

      const positionOf = (i: number) => (trigger ? trigger.start + ((trigger.end - trigger.start) * i) / last : 0);
      const snap = new RoadmapSnap(() => lenisRef.current, () => cards.map((_, i) => positionOf(i)), touch);
      if (touch) pin.classList.add("grid-lines");

      const light = () => {
        if (!ring || !gradient) return;
        const g = glow.toFixed(3);
        if (g !== lit) {
          lit = g;
          ring.style.setProperty("--lit", g);
          const span = half + glow * ROADMAP_GLOW.reach * radius;
          gradient.setAttribute("x1", String(center - span));
          gradient.setAttribute("x2", String(center + span));
        }
        const color = `rgb(${tone.map(Math.round).join(" ")})`;
        if (color !== tint) {
          tint = color;
          ring.style.setProperty("--lit-color", color);
        }
      };

      const rest = () => {
        if (ticking) gsap.ticker.remove(tick);
        ticking = false;
        k = undefined;
        aim = undefined;
      };

      const spin = (dt: number) => {
        if (!tl || !ring || !dt) return;
        const r = tl.progress() * last;
        if (k === undefined) tone = [...tones[Math.round(r)]] as Rgb;
        const velocity = k === undefined ? 0 : (r - k) / dt;
        k = r;
        const target = Math.min(1, Math.abs(velocity) / ROADMAP_GLOW.full);
        glow +=
          (target - glow) * (1 - Math.exp(-(target > glow ? ROADMAP_GLOW.rise : ROADMAP_GLOW.fall) * dt));
        const next = velocity > 0 ? Math.ceil(r - 0.02) : Math.floor(r + 0.02);
        if (Math.abs(velocity) > 0.05) aim = gsap.utils.clamp(0, last, next);
        const goal = tones[aim ?? Math.round(r)];
        const mix = 1 - Math.exp(-ROADMAP_GLOW.tint * dt);
        tone = tone.map((c, i) => c + (goal[i] - c) * mix) as Rgb;
        if (!target && glow < 0.002) {
          glow = 0;
          if (!spinning) rest();
        }
        light();
      };

      function tick(_time: number, deltaTime: number) {
        spin(Math.min(deltaTime, 100) / 1000);
      }

      const fits = (cardH: number, margin: number) =>
        stage.offsetTop + wheel.offsetTop + cardH <= pin.clientHeight - margin;

      /** How far the rotated second-to-last card hangs below the stage (clipped by the next section otherwise). */
      const hang = (step: number) => {
        const width = stage.offsetWidth;
        const { offsetLeft: left, offsetTop: top, offsetWidth: w } = wheel;
        const [ox, oy] = getComputedStyle(wheel).transformOrigin.split(" ").map(parseFloat);
        const cx = left + ox;
        const cy = top + oy;
        const a = (-step * Math.PI) / 180;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const bottom = top + cards[cards.length - 2].offsetHeight;
        const pts = (
          [
            [left, top],
            [left + w, top],
            [left + w, bottom],
            [left, bottom],
          ] as const
        ).map(([x, y]) => [cx + (x - cx) * cos - (y - cy) * sin, cy + (x - cx) * sin + (y - cy) * cos]);
        let max = 0;
        pts.forEach((p, i) => {
          const q = pts[(i + 1) % pts.length];
          const dx = q[0] - p[0];
          let t0 = 0;
          let t1 = 1;
          if (dx) {
            const a0 = -p[0] / dx;
            const a1 = (width - p[0]) / dx;
            t0 = Math.max(0, Math.min(a0, a1));
            t1 = Math.min(1, Math.max(a0, a1));
          } else if (p[0] < 0 || p[0] > width) return;
          if (t0 > t1) return;
          max = Math.max(max, p[1] + (q[1] - p[1]) * t0, p[1] + (q[1] - p[1]) * t1);
        });
        return Math.max(0, Math.ceil(max - stage.offsetHeight));
      };

      const cleanup = () => {
        snap.watch(false);
        trigger?.kill();
        tl?.kill();
        trigger = null;
        tl = null;
        rest();
        spinning = false;
        glow = 0;
        lit = null;
        tint = null;
        ring?.style.removeProperty("--lit");
        ring?.style.removeProperty("--lit-color");
        stage.style.removeProperty("--wheel");
        if (intro && intro.parentElement !== pin) pin.prepend(intro);
        section.style.removeProperty("height");
        section.style.removeProperty("--hang");
        stage.style.removeProperty("--card-h");
        stage.style.removeProperty("--gap");
      };

      const build = () => {
        cleanup();
        const step = px(getComputedStyle(stage).getPropertyValue("--step"));
        const cardH = Math.max(...cards.map((c) => c.offsetHeight));
        const unit = px(getComputedStyle(document.body).fontSize) / 16;
        stage.style.setProperty("--card-h", `${cardH}px`);
        stage.style.setProperty("--gap", intro ? getComputedStyle(intro).marginBottom : "0px");

        const moveOut = !!intro && !fits(cardH, ROADMAP_FIT_MARGIN * unit);
        if (moveOut && intro) {
          section.prepend(intro);
          stage.style.setProperty("--gap", "0px");
        }
        const introSpace = moveOut && intro ? intro.offsetHeight + px(getComputedStyle(intro).marginBottom) : 0;
        const pinH = pin.offsetHeight;
        const remaining = section.offsetHeight - pinH;
        if (touch) section.style.height = `${pinH + Math.round((remaining + introSpace) / ROADMAP_GRID) * ROADMAP_GRID}px`;
        else if (moveOut) section.style.height = `${introSpace + pinH + remaining}px`;
        section.style.setProperty("--hang", `${hang(step)}px`);

        ring = rings.find((r) => getComputedStyle(r).display !== "none");
        gradient = ring?.querySelector("linearGradient");
        center = ring ? ring.viewBox.baseVal.width / 2 : 0;
        radius = ring?.querySelector("circle")?.r.baseVal.value ?? 0;
        half = px(getComputedStyle(stage).getPropertyValue("--card")) / 2;
        tones = cards.map(
          (c) =>
            (getComputedStyle(c.firstElementChild as Element).backgroundColor.match(/[\d.]+/g) ?? ["0", "0", "0"])
              .slice(0, 3)
              .map(Number) as Rgb,
        );

        tl = gsap.timeline().to(stage, { "--wheel": -step * last, duration: 1, ease: "none" });
        trigger = ScrollTrigger.create({
          trigger: pin,
          start: "top top",
          endTrigger: section,
          end: "bottom bottom",
          scrub: touch ? 0.1 : true,
          animation: tl,
          onToggle: (self) => {
            snap.watch(self.isActive);
            spinning = self.isActive;
            if (self.isActive && !ticking) {
              ticking = true;
              gsap.ticker.add(tick);
            }
          },
        });
      };

      let resizeTimer: ReturnType<typeof setTimeout> | undefined;
      let lastWidth = window.innerWidth;
      let lastHeight = window.innerHeight;
      const onResize = () => {
        // Touch browsers fire resize when the URL bar collapses — only rebuild on real changes.
        if (touch && window.innerWidth === lastWidth && Math.abs(window.innerHeight - lastHeight) < 120) return;
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          build();
          ScrollTrigger.refresh();
        }, 150);
      };

      build();
      let alive = true;
      document.fonts?.ready.then(() => {
        if (!alive) return;
        build();
        ScrollTrigger.refresh();
      });
      window.addEventListener("resize", onResize);

      return () => {
        alive = false;
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", onResize);
        cleanup();
        snap.destroy();
        pin.classList.remove("grid-lines");
      };
    },
    root,
  );

  return (
    <section
      ref={root}
      className="roadmap relative z-2 mt-60 h-[calc(var(--screen-h)*4)] l:mt-0 l:h-[calc(var(--screen-h)*3)]"
      aria-labelledby="roadmap-heading"
    >
      {children}
    </section>
  );
}
