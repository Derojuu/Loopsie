"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

interface ScrollFadeProps {
  /** Colour the edge fades blend into. */
  paint: string;
  className?: string;
  style?: CSSProperties;
  size?: number;
  children: ReactNode;
}

/** Extra height on a paint fade whose edge has no border or radius (hides sub-pixel seams). */
const SEAM = 2;
const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

/**
 * Scroll container with "paint" edge fades rendered as siblings, mirroring the demo's
 * `scrollFade` action: the fades track the scroller box and fade in when content
 * is clipped above / below.
 */
export function ScrollFade({ paint, className, style, size = 24, children }: ScrollFadeProps) {
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    const fades = [startRef.current, endRef.current];
    if (!el || fades.some((f) => !f)) return;
    const [start, end] = fades as HTMLDivElement[];
    let scrollable = false;
    let padTop = 0;
    let padBottom = 0;

    const setVar = (name: string, value: string) => [el, start, end].forEach((n) => n.style.setProperty(name, value));

    const onScroll = () => {
      const top = el.scrollTop;
      const rest = el.scrollHeight - el.clientHeight - top;
      start.style.opacity = String(scrollable ? clamp01((top - padTop) / size) : 0);
      end.style.opacity = String(scrollable ? clamp01((rest - padBottom) / size) : 0);
    };

    const layout = () => {
      const cs = getComputedStyle(el);
      const isFlex = cs.display.includes("flex");
      scrollable = /auto|scroll/.test(cs.overflowY);
      el.dataset.fade = scrollable ? "band" : "off";
      padTop = parseFloat(cs.paddingTop) || 0;
      padBottom = parseFloat(cs.paddingBottom) || 0;
      setVar("--fade-paint", paint);
      setVar("--fade-size", `${size}px`);
      setVar("--fade-pt", `${padTop}px`);
      setVar("--fade-pb", `${padBottom}px`);
      setVar("--fade-pl", cs.paddingLeft);
      setVar("--fade-pr", cs.paddingRight);
      setVar("--fade-gap", `${(isFlex && parseFloat(cs.rowGap)) || 0}px`);

      const n = (v: string) => parseFloat(v) || 0;
      const inner = (radius: string, border: string) => Math.max(0, n(radius) - n(border));
      const tl = inner(cs.borderTopLeftRadius, cs.borderTopWidth);
      const tr = inner(cs.borderTopRightRadius, cs.borderTopWidth);
      const br = inner(cs.borderBottomRightRadius, cs.borderBottomWidth);
      const bl = inner(cs.borderBottomLeftRadius, cs.borderBottomWidth);
      const edgeTop = n(cs.borderTopWidth) > 0 || tl > 0 || tr > 0;
      const edgeBottom = n(cs.borderBottomWidth) > 0 || br > 0 || bl > 0;
      const top = el.offsetTop + el.clientTop;
      const bottom = top + el.clientHeight - size;
      const common = { left: `${el.offsetLeft + el.clientLeft}px`, width: `${el.clientWidth}px` };
      const seamTop = edgeTop ? 0 : SEAM;
      const seamBottom = edgeBottom ? 0 : SEAM;
      Object.assign(start.style, common, {
        top: `${top - seamTop}px`,
        height: `${size + seamTop}px`,
        borderRadius: `${tl}px ${tr}px 0 0`,
      });
      Object.assign(end.style, common, {
        top: `${bottom}px`,
        height: `${size + seamBottom}px`,
        borderRadius: `0 0 ${br}px ${bl}px`,
      });
      onScroll();
    };

    const ro = new ResizeObserver(layout);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    for (const child of el.children) ro.observe(child);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layout);
    layout();
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", layout);
    };
  }, [paint, size]);

  return (
    <>
      <div ref={startRef} className="scroll-fade" data-edge="start" data-kind="paint" aria-hidden="true" style={{ opacity: 0 }} />
      <div ref={endRef} className="scroll-fade" data-edge="end" data-kind="paint" aria-hidden="true" style={{ opacity: 0 }} />
      <div ref={scrollRef} className={className} style={style} data-scrollbar="" data-fade="off">
        {children}
      </div>
    </>
  );
}
