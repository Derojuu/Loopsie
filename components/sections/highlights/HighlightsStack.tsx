"use client";

import { useRef, type ReactNode } from "react";
import { useGsap } from "@/hooks/useGsap";
import { useLenis } from "@/components/providers/SmoothScroll";
import { ScrollTrigger } from "@/lib/gsap";
import { STACK } from "@/constants/highlights";
import { BREAKPOINTS } from "@/constants/motion";
import { createStackSnap } from "@/components/sections/highlights/stackSnap";

const px = (el: Element, prop: "top" | "rowGap" | "marginBottom") => parseFloat(getComputedStyle(el)[prop]) || 0;
const pageTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;

/** Space the fixed nav currently occupies (published on <body> by the nav). */
const navRoom = () => {
  const style = getComputedStyle(document.body);
  return (parseFloat(style.getPropertyValue("--nav-offset")) || 0) + (parseFloat(style.getPropertyValue("--nav-height")) || 0);
};

/** Piecewise-linear lookup into `stops` at fractional index `at`. */
const sample = (stops: readonly number[], at: number) => {
  const r = Math.min(at, stops.length - 1);
  const i = Math.min(Math.floor(r), stops.length - 2);
  return stops[i] + (stops[i + 1] - stops[i]) * (r - i);
};

interface HighlightsStackProps {
  children: ReactNode;
}

/**
 * Desktop: cards stick on top of each other, earlier ones tilt back, shrink and
 * darken; the heading rides along until the last card. All widths: scroll snaps to cards.
 */
export function HighlightsStack({ children }: HighlightsStackProps) {
  const root = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGsap(
    (gsap) => {
      const el = root.current;
      const wrap = el?.querySelector<HTMLElement>(".highlights_cards");
      if (!el || !wrap) return;
      const cards = [...wrap.querySelectorAll<HTMLElement>(".highlights_card")];
      if (!cards.length) return;
      const title = el.querySelector<HTMLElement>(".highlights_title");
      const last = cards[cards.length - 1];

      const stops = () => {
        const [first, second] = cards.slice(0, 2).map((c) => px(c, "top"));
        const gap = px(wrap, "rowGap");
        let top = pageTop(wrap);
        return cards.map((card, i) => {
          const stop = top - first - (second - first) * i;
          top += card.offsetHeight + gap;
          return stop;
        });
      };
      const snap = createStackSnap(lenis, stops);

      let teardown: (() => void)[] = [];
      const cleanup = () => {
        snap.watch(false);
        teardown.forEach((fn) => fn());
        teardown = [];
        wrap.style.removeProperty("--stack-top");
        wrap.style.removeProperty("--spacing");
        if (title) gsap.set(title, { clearProps: "transform" });
        gsap.set(cards, { clearProps: "transform" });
        cards.forEach((c) =>
          gsap.set(c.querySelectorAll(".highlights_trame, .highlights_text, .feature-visual"), { clearProps: "opacity" }),
        );
      };

      const stackTop = () => STACK.pinOffset + (title ? title.offsetHeight + px(title, "marginBottom") : 0);
      const reach = () => px(cards[Math.max(0, cards.length - 2)], "top") + Math.max(...cards.map((c) => c.offsetHeight));
      const fits = (room: number) => reach() <= window.innerHeight - room;
      const shrink = (room: number) => {
        const limit = window.innerHeight - room;
        let scale = 1;
        for (let i = 0; i < 3 && scale > STACK.minScale; i++) {
          const r = reach();
          if (r <= limit) return;
          scale = Math.max(STACK.minScale, (scale * limit) / r);
          wrap.style.setProperty("--spacing", `calc(var(--size-font) / var(--size-unit) * ${scale})`);
        }
      };

      const stack = () => {
        wrap.style.setProperty("--stack-top", `${stackTop()}px`);
        const rem = parseFloat(getComputedStyle(document.body).fontSize) / 16;
        const tight = !fits(STACK.bottomRoom * rem);
        if (tight) {
          wrap.style.setProperty("--stack-top", `${STACK.tightTop * rem}px`);
          shrink(STACK.bottomRoom * rem);
        }

        cards.forEach((card, i) => {
          if (card === last) return;
          const tween = gsap.to(card, {
            scale: 0.82 + i * 0.04,
            rotateX: "-8deg",
            immediateRender: true,
            scrollTrigger: { trigger: card, start: `top ${15 + i * 3}%`, endTrigger: last, end: "top 6%", scrub: true },
          });
          teardown.push(() => {
            tween.scrollTrigger?.kill();
            tween.kill();
          });
        });

        const layers = cards.slice(0, -1).map((card) => ({
          shade: gsap.quickSetter(card.querySelector(".highlights_trame"), "opacity"),
          fade: gsap.quickSetter(card.querySelectorAll(".highlights_text, .feature-visual"), "opacity"),
        }));
        let stopList = stops();
        const shade = (scroll: number) => {
          let depth = 0;
          for (let i = layers.length - 1; i >= 0; i--) {
            const span = stopList[i + 1] - stopList[i] || 1;
            depth += gsap.utils.clamp(0, 1, (scroll - stopList[i]) / span);
            layers[i].shade(sample(STACK.shadeStops, depth));
            layers[i].fade(sample(STACK.fadeStops, depth));
          }
        };
        const depth = ScrollTrigger.create({
          start: () => stops()[0],
          end: () => stops().at(-1)!,
          onRefresh: (self) => {
            stopList = stops();
            shade(self.scroll());
          },
          onUpdate: (self) => shade(self.scroll()),
        });
        teardown.push(() => depth.kill());
        shade(window.scrollY);

        if (title && !tight) {
          const setY = gsap.quickSetter(title, "y", "px");
          let titleTop = 0;
          let distance = 0;
          const measure = () => {
            const y = Number(gsap.getProperty(title, "y")) || 0;
            titleTop = pageTop(title) - y;
            distance = Math.max(0, pageTop(last) - stackTop() - (titleTop - STACK.pinOffset));
          };
          const pin = () => setY(gsap.utils.clamp(0, distance, window.scrollY - titleTop + STACK.pinOffset + navRoom()));
          const onRefresh = () => {
            measure();
            pin();
          };
          const offScroll = lenis ? lenis.on("scroll", pin) : null;
          if (!lenis) window.addEventListener("scroll", pin, { passive: true });
          ScrollTrigger.addEventListener("refresh", onRefresh);
          onRefresh();
          teardown.push(() => {
            offScroll?.();
            window.removeEventListener("scroll", pin);
            ScrollTrigger.removeEventListener("refresh", onRefresh);
          });
        }
      };

      const build = () => {
        cleanup();
        if (window.innerWidth >= BREAKPOINTS.desktop) stack();
        const trigger = ScrollTrigger.create({
          start: () => stops()[0],
          end: () => stops().at(-1)!,
          onToggle: (self) => snap.watch(self.isActive),
        });
        teardown.push(() => trigger.kill());
      };

      // Rebuild on width changes, and on height changes on desktop (they decide whether the stack fits).
      let size = [window.innerWidth, window.innerHeight];
      let timer = 0;
      const onResize = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          const [w, h] = size;
          const desktop = window.innerWidth >= BREAKPOINTS.desktop;
          if (window.innerWidth === w && (!desktop || window.innerHeight === h)) return;
          size = [window.innerWidth, window.innerHeight];
          build();
          ScrollTrigger.refresh();
        }, 150);
      };

      build();
      window.addEventListener("resize", onResize);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("resize", onResize);
        cleanup();
        snap.destroy();
      };
    },
    root,
    [lenis],
  );

  return (
    <div ref={root} className="container max-w-none px-cont">
      {children}
    </div>
  );
}
