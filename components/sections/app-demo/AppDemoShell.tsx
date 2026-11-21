"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useGsap } from "@/hooks/useGsap";
import { ScrollTrigger } from "@/lib/gsap";

/** Heading size at rest (`--spacing-head` units) and max extra size while pinned. */
const HEAD_BASE = 74;
const HEAD_BOOST_MAX = 110;
/** Share of the viewport width the enlarged heading may fill. */
const HEAD_FILL = 0.9;
const REFRESH_DEBOUNCE = 150;
const RESIZE_DEBOUNCE = 200;

interface AppDemoShellProps {
  heading: ReactNode;
  children: ReactNode;
}

/**
 * Pinned "That's why Loopsii exists" section: the sticky heading shrinks from a
 * viewport-filling size to its resting size as the demo scrolls in.
 */
export function AppDemoShell({ heading, children }: AppDemoShellProps) {
  const root = useRef<HTMLElement>(null);

  useGsap(
    (gsap) => {
      const section = root.current;
      if (!section) return;
      const block = section.querySelector<HTMLElement>(".app-demo_title")!;
      const title = block.querySelector<HTMLElement>(".app-demo_heading .h2")!;
      const stage = section.querySelector<HTMLElement>(".app-demo_stage")!;
      let reveal: gsap.core.Timeline | null = null;
      let trigger: ScrollTrigger | null = null;
      let stageObserver: ResizeObserver | null = null;
      let refreshTimer = 0;
      let resizeTimer = 0;

      const measure = () => {
        const progress = parseFloat(String(gsap.getProperty(title, "--progress"))) || 0;
        gsap.set(title, { "--progress": 1 });
        section.style.setProperty("--app-demo-block", `${block.getBoundingClientRect().height}px`);
        const width = title.getBoundingClientRect().width;
        const boost = width
          ? Math.min(HEAD_BOOST_MAX, Math.max(0, HEAD_BASE * ((window.innerWidth * HEAD_FILL) / width - 1)))
          : HEAD_BOOST_MAX;
        section.style.setProperty("--app-demo-boost", boost.toFixed(2));
        gsap.set(title, { "--progress": progress });
      };

      const cleanup = () => {
        trigger?.kill();
        reveal?.kill();
        stageObserver?.disconnect();
        window.clearTimeout(refreshTimer);
        trigger = reveal = stageObserver = null;
        gsap.set(title, { clearProps: "transform,--progress" });
      };

      const build = () => {
        cleanup();
        if (!section.getClientRects().length) return;
        gsap.set(title, { xPercent: -50, yPercent: -50 });
        measure();
        reveal = gsap.timeline({ paused: true });
        reveal.fromTo(title, { "--progress": 0 }, { "--progress": 1, duration: 0.8, ease: "none" });
        trigger = ScrollTrigger.create({
          trigger: section,
          start: "top top-=45%",
          end: "+=65%",
          scrub: true,
          animation: reveal,
          onRefresh: measure,
        });
        let height = stage.offsetHeight;
        stageObserver = new ResizeObserver(() => {
          if (stage.offsetHeight === height) return;
          height = stage.offsetHeight;
          window.clearTimeout(refreshTimer);
          refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), REFRESH_DEBOUNCE);
        });
        stageObserver.observe(stage);
      };

      const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(build, RESIZE_DEBOUNCE);
      };

      build();
      document.fonts?.ready.then(() => section.isConnected && build());
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
        window.clearTimeout(resizeTimer);
        cleanup();
      };
    },
    root,
    [],
  );

  return (
    <section ref={root} className="app-demo relative max-[1024px]:hidden app-demo--pinned z-2 -mt-(--screen-h)" data-app-demo="">
      <div className="app-demo_track">
        <div className="container max-w-none app-demo_intro px-cont">
          <div className="app-demo_title flex flex-col items-center text-center text-black">
            <div className="app-demo_heading relative self-stretch">
              <h2 className="h2 absolute" style={{ transform: "translate(-50%, -50%)" } as CSSProperties}>
                {heading}
              </h2>
            </div>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}
