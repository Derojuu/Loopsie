"use client";

import { useRef, type CSSProperties } from "react";
import { cn } from "@/utils/cn";
import { useGsap } from "@/hooks/useGsap";
import { LINKS } from "@/constants/site";

/** Colour sweep layers revealed (in order) on hover. */
const SWEEP_COLORS = ["bg-sage", "bg-sky", "bg-apricot", "bg-main"] as const;

const ARROW_DEFAULT = "M6.82353 2.1L-0.00146866 8.946L1.57353 10.521L8.41953 3.654V9.24H10.5195V0H1.27953V2.1H6.82353Z";
const ARROW_TOP = "M10.167 0.3537L10.167 0.3467L10.174 0.3467L10.174 0.3537L10.167 0.3537Z";
const ARROW_BOTTOM = "M1.0195 9.4854L1.0244 9.4805L1.0293 9.4854L1.0244 9.4903L1.0195 9.4854Z";

export interface ButtonProps {
  label?: string;
  href?: string;
  /** Analytics hook mirrored from the original `data-track` attribute. */
  track?: string;
  className?: string;
  style?: CSSProperties;
}

const heightOf = (el: Element) => parseFloat(getComputedStyle(el).height) || 0;
const widthOf = (el: Element) => parseFloat(getComputedStyle(el).width) || 0;

/**
 * Pill CTA with an arrow bubble. On hover four colour layers sweep across,
 * characters pulse in weight/scale and the arrow morphs out and back in.
 */
export function Button({ label = "Sign up for free", href = LINKS.signUp, track, className, style }: ButtonProps) {
  const root = useRef<HTMLAnchorElement>(null);

  useGsap(
    (gsap) => {
      const el = root.current;
      if (!el) return;
      const textWrapper = el.querySelector<HTMLElement>(".btn_text-wrapper")!;
      const iconWrapper = el.querySelector<HTMLElement>(".btn_arrow-parent")!;
      const textBgs = [...textWrapper.querySelectorAll<HTMLElement>(".btn_bg-item")];
      const iconBgs = [...iconWrapper.querySelectorAll<HTMLElement>(".btn_bg-item")];
      const layers = [textWrapper, iconWrapper].map((w) => [
        ...w.querySelectorAll<HTMLElement>(".btn_bg-solid, .btn_bg-item"),
      ]);
      const chars = [...el.querySelectorAll<HTMLElement>(".btn_char")];
      const [arrowOut, arrowIn] = [...el.querySelectorAll<SVGPathElement>("svg path")];
      const frame = el.closest<HTMLElement>("[data-button-frame]");
      let tl: gsap.core.Timeline | undefined;
      let fitted = 0;

      // Propagate each layer's progress to the previous one (`--next`) and to an optional frame.
      const link = () => {
        layers.forEach((layer) =>
          layer.forEach((node, i) =>
            node.style.setProperty("--next", layer[i + 1]?.style.getPropertyValue("--progress") || "0"),
          ),
        );
        layers[0]
          .slice(1)
          .forEach((node, i) => frame?.style.setProperty(`--p${i + 1}`, node.style.getPropertyValue("--progress") || "0"));
      };

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
        gsap.set([...textBgs, ...iconBgs], { "--progress": 0 });
        gsap.set(chars, { "--progress": 0, "--enter": 0, "--leave": 0 });
        textBgs.forEach((bg, i) => tl!.to(bg, { "--progress": 1, duration: 1.5 }, i * 0.04));
        iconBgs.forEach((bg, i) => tl!.to(bg, { "--progress": 1, duration: 1.5 }, i * 0.04));
        tl.to(chars, { "--progress": 1, stagger: 0.02 }, 0.2);
        chars.forEach((c, i) => {
          tl!.to(c, { "--enter": 1, duration: 0.6, ease: "circ.in" }, i * 0.02 + 0.2);
          tl!.to(c, { "--leave": 1, duration: 0.4, ease: "circ.in" }, i * 0.02 + 0.6);
        });
        tl.fromTo(arrowOut, { morphSVG: ARROW_DEFAULT }, { morphSVG: ARROW_TOP, duration: 1 }, 0);
        tl.fromTo(arrowIn, { morphSVG: ARROW_BOTTOM }, { morphSVG: ARROW_DEFAULT, duration: 1 }, 0.3);
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
    [label],
  );

  return (
    <a
      ref={root}
      href={href}
      data-track={track}
      aria-label={label}
      className={cn("btn flex flex-row", className)}
      style={style}
    >
      <div className="btn_arrow-parent relative flex items-center justify-center text-white">
        <div className="btn_arrow-icon relative z-2 aspect-square w-12">
          <svg width="100%" height="100%" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path d={ARROW_DEFAULT} fill="currentColor" />
          </svg>
          <svg width="100%" height="100%" className="absolute inset-0 text-black" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path d={ARROW_BOTTOM} fill="currentColor" />
          </svg>
        </div>
        <div className="btn_arrow-bg absolute inset-0 z-0">
          <div className="btn_bg-solid absolute inset-0 bg-black" />
          {SWEEP_COLORS.map((color) => (
            <div key={color} className={cn("btn_bg-item absolute inset-0", color)} />
          ))}
        </div>
      </div>
      <div className="btn_text-wrapper relative rounded-full px-30 py-18 text-white">
        <div className="btn_text relative z-2" aria-hidden="true">
          <div className="relative block text-start">
            {[...label].map((char, i) =>
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
        <div className="btn_text-bg absolute inset-0 z-0">
          <div className="btn_bg-solid absolute inset-0 rounded-full bg-black" />
          {SWEEP_COLORS.map((color) => (
            <div key={color} className={cn("btn_bg-item absolute rounded-full", color)} />
          ))}
        </div>
      </div>
    </a>
  );
}
