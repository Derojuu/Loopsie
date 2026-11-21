"use client";

import { useRef, type CSSProperties } from "react";
import { useGsap } from "@/hooks/useGsap";
import { ScrollTrigger, SplitText } from "@/lib/gsap";
import { MEDIA } from "@/constants/motion";
import { DASH_CARD_POSITIONS, DASH_STAGE, DASH_TILT } from "@/constants/dashboard";
import { DashCta } from "@/components/sections/app-demo/DashCta";
import { DashFrame } from "@/components/sections/dashboard/DashFrame";
import { DashGrid } from "@/components/sections/dashboard/DashGrid";
import {
  BalanceCard,
  ClosingCard,
  CommunicationCard,
  DealCard,
  FeedbackCard,
  KickoffCard,
  MoneyCard,
  ScopeCard,
} from "@/components/sections/dashboard/DashCards";

const COARSE = "(hover: none) and (pointer: coarse)";

/** Mobile/tablet (<1024px) replacement for the pinned app demo: a static collage of product cards. */
export function Dashboard() {
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useGsap(
    (gsap) => {
      const section = root.current;
      const stage = stageRef.current;
      if (!section || !stage) return;
      const title = section.querySelector<HTMLElement>("h2")!;
      const wrapper = section.querySelector<HTMLElement>(".dashboard_wrapper")!;
      const scene = section.querySelector<HTMLElement>(".dashboard_scene")!;
      const items = [...scene.querySelectorAll<HTMLElement>(".dash-card, .dash-cta")];
      const reduced = matchMedia(MEDIA.reducedMotion).matches;
      const cleanups: (() => void)[] = [];

      // Title: words rise out of their lines when the section enters.
      const split = new SplitText(title, { type: "lines, words" });
      gsap.set(split.lines, { overflow: "hidden", paddingBottom: "0.1em", marginBottom: "-0.1em" });
      const reveal = gsap.timeline({ paused: true });
      reveal.fromTo(split.words, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: "power4", stagger: 0.04 }, 0);
      const revealTrigger = ScrollTrigger.create({ trigger: title.parentElement, start: "top 85%", onEnter: () => reveal.play() });
      cleanups.push(() => {
        revealTrigger.kill();
        reveal.kill();
        split.revert();
      });

      if (!reduced) {
        // Cards pop in from the top-left, staggered by their distance down the stage.
        const order = (el: HTMLElement) =>
          parseFloat(el.style.getPropertyValue("--y")) + parseFloat(el.style.getPropertyValue("--x")) * 0.3;
        const max = Math.max(...items.map(order));
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(scene, { scale: 0.8, transformOrigin: "50% 0%" }, { scale: 1, duration: 1, ease: "power1.out" }, 0);
        items.forEach((el) =>
          tl.fromTo(el, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.25, ease: "back(1.2)" }, (order(el) / max) * 0.45),
        );
        const trigger = matchMedia(COARSE).matches
          ? ScrollTrigger.create({ trigger: wrapper, start: "top 85%", onEnter: () => tl.duration(1.4).play() })
          : ScrollTrigger.create({ trigger: wrapper, start: "top 95%", end: "+=80%", scrub: true, animation: tl });
        cleanups.push(() => {
          trigger.kill();
          tl.kill();
        });
      }

      // Pointer tilt with per-card parallax (fine pointers only).
      if (matchMedia(MEDIA.finePointer).matches) {
        const ease = { duration: DASH_TILT.duration, ease: "power3.out" };
        const rotX = gsap.quickTo(stage, "rotationX", ease);
        const rotY = gsap.quickTo(stage, "rotationY", ease);
        const cards = items.map((el) => ({
          z: parseFloat(el.style.getPropertyValue("--z")) || 0,
          x: gsap.quickTo(el, "x", ease),
          y: gsap.quickTo(el, "y", ease),
        }));
        const onMove = (e: MouseEvent) => {
          const r = scene.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          const nx = gsap.utils.clamp(-1, 1, ((e.clientX - r.left) / r.width) * 2 - 1);
          const rx = gsap.utils.clamp(-1, 1, ((e.clientY - r.top) / r.height) * 2 - 1) * -DASH_TILT.max;
          const ry = nx * DASH_TILT.max;
          rotX(rx);
          rotY(ry);
          const unit = r.width / DASH_STAGE.width;
          const dx = Math.sin((ry * Math.PI) / 180) * unit;
          const dy = -Math.sin((rx * Math.PI) / 180) * unit;
          cards.forEach((c) => {
            c.x(c.z * dx);
            c.y(c.z * dy);
          });
        };
        window.addEventListener("mousemove", onMove);
        cleanups.push(() => window.removeEventListener("mousemove", onMove));
      }

      return () => cleanups.forEach((fn) => fn());
    },
    root,
    [],
  );

  return (
    <section
      ref={root}
      className="dashboard relative z-3 pb-[calc(var(--section)+var(--spacing)*40)] min-[1024px]:hidden l:pb-100 s:pb-180"
    >
      <div className="container max-w-none px-cont">
        <div className="dashboard_title flex items-center justify-center text-center text-black">
          <h2 className="h2">That&apos;s why Loopsii exists</h2>
        </div>
        <div className="dashboard_wrapper px-100 l:px-0 l:-mx-16 s:mx-0">
          <div className="dashboard_scene">
            <div ref={stageRef} className="dashboard_stage">
              <DashFrame grid={<DashGrid stageRef={stageRef} />} />
              <ScopeCard />
              <FeedbackCard />
              <MoneyCard />
              <ClosingCard />
              <DealCard />
              <CommunicationCard />
              <KickoffCard />
              <BalanceCard />
              <DashCta
                className="absolute"
                style={{ "--x": DASH_CARD_POSITIONS.cta.x, "--y": DASH_CARD_POSITIONS.cta.y, "--z": DASH_CARD_POSITIONS.cta.z } as CSSProperties}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
