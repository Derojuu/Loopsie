"use client";

import { useRef } from "react";
import { useGsap } from "@/hooks/useGsap";
import { LINKS } from "@/constants/site";
import { PRICING_CTA } from "@/constants/pricing";
import { TESTIMONIALS_ARROW_PATHS as ARROW } from "@/constants/testimonials";

const SWEEP_COLORS = ["bg-sage", "bg-sky", "bg-apricot", "bg-main"] as const;

const heightOf = (el: Element) => parseFloat(getComputedStyle(el).height) || 0;
const widthOf = (el: Element) => parseFloat(getComputedStyle(el).width) || 0;

/**
 * Full-width "Try it free for 14 days" bar. Same behaviour as the shared
 * `<Button />` (colour sweep, char pulse, arrow morph) but with the original's
 * bar layout (text left, arrow right, square-ish 20px radius), which the pill
 * markup of `<Button />` cannot express.
 */
export function PricingCta() {
  const root = useRef<HTMLAnchorElement>(null);

  useGsap(
    (gsap) => {
      const el = root.current;
      if (!el) return;
      const iconWrapper = el.querySelector<HTMLElement>(".btn_arrow-parent")!;
      const layers = [...el.querySelectorAll<HTMLElement>(".btn_text-wrapper :is(.btn_bg-solid, .btn_bg-item)")];
      const sweeps = layers.slice(1);
      const chars = [...el.querySelectorAll<HTMLElement>(".btn_char")];
      const [arrowOut, arrowIn] = [...el.querySelectorAll<SVGPathElement>("svg path")];
      let tl: gsap.core.Timeline | undefined;
      let fitted = 0;

      const link = () =>
        layers.forEach((node, i) =>
          node.style.setProperty("--next", layers[i + 1]?.style.getPropertyValue("--progress") || "0"),
        );

      const build = () => {
        chars.forEach((c) => c.style.removeProperty("width"));
        iconWrapper.style.width = `${(heightOf(iconWrapper) * 51) / 60}px`;
        el.style.setProperty("--height", `${heightOf(el) / 2}px`);
        el.style.setProperty("--width", `${widthOf(el)}px`);
        el.style.setProperty("--arrowSize", `${widthOf(iconWrapper)}px`);
        const widths = chars.map(widthOf);
        chars.forEach((c, i) => (c.style.width = `${widths[i]}px`));

        tl?.kill();
        tl = gsap.timeline({ paused: true, defaults: { ease: "expo.inOut", duration: 1 }, onUpdate: link });
        gsap.set(sweeps, { "--progress": 0 });
        gsap.set(chars, { "--progress": 0, "--enter": 0, "--leave": 0 });
        sweeps.forEach((bg, i) => tl!.to(bg, { "--progress": 1, duration: 1.5 }, i * 0.04));
        tl.to(chars, { "--progress": 1, stagger: 0.02 }, 0.2);
        chars.forEach((c, i) => {
          tl!.to(c, { "--enter": 1, duration: 0.6, ease: "circ.in" }, i * 0.02 + 0.2);
          tl!.to(c, { "--leave": 1, duration: 0.4, ease: "circ.in" }, i * 0.02 + 0.6);
        });
        tl.fromTo(arrowOut, { morphSVG: ARROW.default }, { morphSVG: ARROW.top, duration: 1 }, 0);
        tl.fromTo(arrowIn, { morphSVG: ARROW.bottom }, { morphSVG: ARROW.default, duration: 1 }, 0.3);
        link();
        fitted = el.offsetWidth;
      };

      const onEnter = () => {
        tl?.timeScale(1.25).play();
        chars.forEach((c) => c.style.setProperty("--deg", `${gsap.utils.random(-8, 8, 2)}deg`));
      };
      const onLeave = () => tl?.timeScale(1.25).reverse();

      const observer = new ResizeObserver(() => {
        if (el.offsetWidth && el.offsetWidth !== fitted) build();
      });
      document.fonts.ready.then(() => el.isConnected && build());
      observer.observe(el);
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);

      return () => {
        observer.disconnect();
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        tl?.kill();
      };
    },
    root,
    [],
  );

  return (
    <a
      ref={root}
      className="pricing_cta relative mt-10 flex h-64 w-full items-center justify-between rounded-20 px-40 text-white s:px-24"
      href={LINKS.signUp}
      data-track={PRICING_CTA.track}
      aria-label={PRICING_CTA.label}
    >
      <div className="btn_text-wrapper absolute inset-0 z-0">
        <div className="btn_bg-solid absolute inset-0 bg-black" />
        {SWEEP_COLORS.map((color) => (
          <div key={color} className={`btn_bg-item absolute inset-0 ${color}`} />
        ))}
      </div>
      <div className="btn_text relative z-2" aria-hidden="true">
        <div className="relative block text-start">
          {[...PRICING_CTA.label].map((char, i) =>
            char === " " ? (
              " "
            ) : (
              <div key={i} className="btn_char relative inline-block">
                {char}
              </div>
            ),
          )}
        </div>
      </div>
      <div className="btn_arrow-parent relative z-2 flex h-full items-center justify-end" aria-hidden="true">
        <div className="btn_arrow-icon relative aspect-square w-12">
          <svg width="100%" height="100%" viewBox="0 0 11 11" fill="none">
            <path d={ARROW.default} fill="currentColor" />
          </svg>
          <svg width="100%" height="100%" className="absolute inset-0 text-black" viewBox="0 0 11 11" fill="none">
            <path d={ARROW.bottom} fill="currentColor" />
          </svg>
        </div>
      </div>
    </a>
  );
}
