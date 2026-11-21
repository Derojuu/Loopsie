"use client";

import { useRef, useState, type CSSProperties } from "react";
import { useGsap } from "@/hooks/useGsap";
import { SplitText } from "@/lib/gsap";
import { MEDIA } from "@/constants/motion";
import {
  TESTIMONIALS,
  TESTIMONIALS_ARROW_PATHS,
  TESTIMONIALS_AUTOPLAY_MS,
  TESTIMONIALS_LOOP_COPIES,
} from "@/constants/testimonials";
import { TestimonialCard } from "@/components/sections/testimonials/TestimonialCard";
import { TestimonialsArrow } from "@/components/sections/testimonials/TestimonialsArrow";
import { TestimonialsSlider } from "@/components/sections/testimonials/testimonialsSlider";

const TOTAL = TESTIMONIALS.length;
const SLIDES = Array.from({ length: TOTAL * TESTIMONIALS_LOOP_COPIES }, (_, i) => TESTIMONIALS[i % TOTAL]);
/** Counter strip: 01..05 followed by 01 again so the wrap scrolls smoothly. */
const DIGITS = [...TESTIMONIALS.map((_, i) => i + 1), 1].map((n) => String(n).padStart(2, "0"));

interface SlideRefs {
  element: HTMLElement;
  wire: HTMLElement;
  paper: HTMLElement;
  img: HTMLElement | null;
  texts: HTMLElement[];
  row: HTMLElement;
  side: HTMLElement;
  foot: HTMLElement;
  feet: HTMLElement[];
  outlines: SVGPathElement[];
  lines: Element[];
  clip: string;
  shift: string;
}

interface CarouselApi {
  prev: () => void;
  next: () => void;
}

/** Builds the card outline (rounded "notched" silhouette) from measured sizes. */
function outlinePath(width: number, height: number, rowHeight: number, sideWidth: number, radius: number) {
  const half = 0.5;
  const r = (radius - half).toFixed(2);
  const pt = (x: number, y: number) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  const arc = (x: number, y: number) => `A${r} ${r} 0 0 1 ${pt(x, y)}`;
  const [s, c, l, u, d, f] = [width, height, rowHeight, sideWidth, radius, half];
  return [
    `M${pt(u + d, f)}`,
    `L${pt(s - d, f)}`,
    arc(s - f, d),
    `L${pt(s - f, l - d)}`,
    arc(s - d, l - f),
    `L${pt(s - d, l + f)}`,
    arc(s - f, l + d),
    `L${pt(s - f, c - d)}`,
    arc(s - d, c - f),
    `L${pt(d, c - f)}`,
    arc(f, c - d),
    `L${pt(f, u + d)}`,
    arc(d, u + f),
    `L${pt(u + f, u + f)}`,
    `L${pt(u + f, d)}`,
    arc(u + d, f),
    "Z",
  ].join("");
}

/**
 * Infinite drag carousel. Cards outside the centre "lens" show their wireframe
 * layer; the paper layer is clipped to the lens, photos parallax/zoom with
 * distance, copy lines slide in on change, it autoplays every 5s when idle.
 */
export function TestimonialsCarousel() {
  const stageRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<CarouselApi | null>(null);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState(1);

  useGsap(
    (gsap) => {
      const stage = stageRef.current;
      const section = stage?.closest("section");
      const track = stage?.querySelector<HTMLElement>(".testimonials_track");
      const strip = stage?.querySelector<HTMLElement>(".testimonials_strip");
      if (!stage || !section || !track || !strip) return;

      const reduce = window.matchMedia(MEDIA.reducedMotion).matches;
      const q = <T extends Element = HTMLElement>(root: Element, sel: string) => root.querySelector<T>(sel)!;
      const slides: SlideRefs[] = ([...track.children] as HTMLElement[]).map((element) => ({
        element,
        wire: q(element, ".testimonials_layer--wire"),
        paper: q(element, ".testimonials_layer--paper"),
        img: element.querySelector<HTMLElement>(".testimonials_img"),
        texts: [
          ...element.querySelectorAll<HTMLElement>(
            ".testimonials_layer--paper :is(.testimonials_title, .testimonials_quote)",
          ),
        ],
        row: q(element, ".testimonials_layer--paper .testimonials_row"),
        side: q(element, ".testimonials_layer--paper .testimonials_side"),
        foot: q(element, ".testimonials_layer--paper .testimonials_plate--foot"),
        feet: [...element.querySelectorAll<HTMLElement>(".testimonials_plate--foot")],
        outlines: [...element.querySelectorAll<SVGPathElement>(".testimonials_outline path")],
        lines: [],
        clip: "",
        shift: "",
      }));

      let index = 0;
      let sleeping = true;
      let wait = 0;
      let hovered = false;
      let focused = false;
      let downX = 0;
      let slot = 0;
      let card = 0;
      let lens = 0;

      const shape = ({ paper, row, side, foot, feet, outlines }: SlideRefs) => {
        const px = (el: Element, prop: "width" | "height" | "borderBottomLeftRadius") =>
          parseFloat(getComputedStyle(el)[prop]);
        const rowHeight = px(row, "height");
        const d = outlinePath(
          px(paper, "width"),
          px(paper, "height"),
          rowHeight,
          px(side, "width"),
          px(foot, "borderBottomLeftRadius"),
        );
        feet.forEach((el) => el.style.setProperty("--top", `${rowHeight}px`));
        outlines.forEach((el) => el.setAttribute("d", d));
      };

      const render = () => {
        const values = slider.parallaxValues;
        if (!values.length || !slot) return;
        slides.forEach((s, n) => {
          const r = values[n];
          const left = r * slot - card / 2;
          const a = Math.min(card, Math.max(0, -lens - left));
          const o = Math.min(card, Math.max(0, left + card - lens));
          const outside = a + o >= card - 0.5;
          const clip = outside ? "none" : `inset(0 ${o.toFixed(2)}px 0 ${a.toFixed(2)}px)`;
          if (clip !== s.clip) {
            s.clip = clip;
            s.paper.style.visibility = outside ? "hidden" : "visible";
            if (!outside) s.paper.style.clipPath = clip;
            const full = !outside && a + o === 0;
            s.wire.style.visibility = full ? "hidden" : "visible";
            s.wire.style.clipPath =
              outside || full
                ? "none"
                : a > 0
                  ? `inset(0 ${(card - a).toFixed(2)}px 0 0)`
                  : `inset(0 0 0 ${(card - o).toFixed(2)}px)`;
          }
          const k = Math.max(-1, Math.min(1, r));
          const shift = `translate3d(${(k * -12).toFixed(2)}%, 0, 0) scale(${(1 + Math.abs(k) * 0.3).toFixed(3)})`;
          if (shift !== s.shift && s.img) {
            s.shift = shift;
            s.img.style.transform = shift;
          }
        });
        const t = ((-slider.current % TOTAL) + TOTAL) % TOTAL;
        strip.style.transform = `translate3d(0, ${(-t).toFixed(3)}em, 0)`;
      };

      const measure = () => {
        const paper = slides[0]?.paper;
        if (!paper) return;
        slot = slider.itemWidth;
        card = parseFloat(getComputedStyle(paper).width);
        lens = card / 2 + parseFloat(getComputedStyle(stage).paddingTop);
        slider.dragSensitivity = 1 / slot;
        slides.forEach(shape);
        render();
      };

      const change = (next: number, prev: number) => {
        index = next;
        const incoming = slides[next];
        const outgoing = slides[prev];
        if (outgoing) {
          gsap.to(outgoing.lines, {
            yPercent: -110,
            duration: reduce ? 0 : 0.45,
            ease: "power3.in",
            stagger: 0.02,
            overwrite: true,
            onComplete: () => {
              gsap.set(outgoing.lines, { yPercent: 110 });
            },
          });
        }
        gsap.to(incoming.lines, {
          yPercent: 0,
          duration: reduce ? 0 : 1.1,
          ease: "expo.out",
          stagger: 0.06,
          delay: reduce ? 0 : 0.12,
          overwrite: true,
        });
        setActive(next);
        setStatus((next % TOTAL) + 1);
      };

      const slider = new TestimonialsSlider(track, {
        lerpFactor: reduce ? 0.05 : 0.3,
        onSlideChange: change,
        onResize: measure,
      });

      // Copy is split into masked lines; only the active slide's lines are revealed.
      const splits = slides.flatMap((s, slideIndex) => {
        const perText: Element[][] = s.texts.map(() => []);
        return s.texts.map((text, textIndex) =>
          SplitText.create(text, {
            type: "lines",
            mask: "lines",
            aria: "none",
            autoSplit: true,
            onSplit: (self: SplitText) => {
              perText[textIndex] = self.lines;
              s.lines = perText.flat();
              gsap.set(self.lines, { yPercent: slideIndex === index ? 0 : 110 });
            },
          }),
        );
      });

      const wake = () => {
        if (!sleeping) return;
        sleeping = false;
        slider.init();
      };
      const go = (action: () => void) => {
        wait = 0;
        wake();
        action();
      };
      const update = () => {
        if (sleeping) return;
        slider.update();
        render();
        const { target, current, isDragging } = slider;
        if (!isDragging && Math.abs(target - current) < 1e-4 && Math.abs(target - Math.round(target)) < 1e-4) {
          sleeping = true;
        }
      };
      const autoplay = (dt: number) => {
        if (reduce || hovered || focused || slider.isDragging) return;
        wait += Math.min(dt || 0, 100);
        if (wait >= TESTIMONIALS_AUTOPLAY_MS) go(() => slider.goToNext());
      };
      const tick = (_time: number, deltaTime: number) => {
        autoplay(deltaTime);
        update();
      };

      apiRef.current = {
        prev: () => go(() => slider.goToPrev()),
        next: () => go(() => slider.goToNext()),
      };

      const onDown = (e: PointerEvent) => {
        downX = e.clientX;
        wait = 0;
        wake();
      };
      // Clicking a side card brings it to the centre.
      const onClick = (e: MouseEvent) => {
        if (Math.abs(e.clientX - downX) > 6) return;
        const i = slides.findIndex((s) => s.element.contains(e.target as Node));
        const offset = Math.round(slider.parallaxValues[i] ?? 0);
        if (offset) go(() => (slider.target = Math.round(slider.target) - offset));
      };
      const onWheel = () => wake();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") apiRef.current?.prev();
        else if (e.key === "ArrowRight") apiRef.current?.next();
        else return;
        e.preventDefault();
      };
      const onEnter = () => (hovered = true);
      const onLeave = () => (hovered = false);
      const onFocus = (e: FocusEvent) => (focused = (e.target as Element).matches(":focus-visible"));
      const onBlur = (e: FocusEvent) => (focused = section.contains(e.relatedTarget as Node | null));

      track.addEventListener("pointerdown", onDown);
      track.addEventListener("click", onClick);
      track.addEventListener("wheel", onWheel, { passive: true });
      section.addEventListener("keydown", onKey);
      stage.addEventListener("mouseenter", onEnter);
      stage.addEventListener("mouseleave", onLeave);
      section.addEventListener("focusin", onFocus);
      section.addEventListener("focusout", onBlur);

      // Arrow hover: colour sweep + arrow morph (fine pointers only).
      const hovers = window.matchMedia(MEDIA.finePointer).matches
        ? [...stage.querySelectorAll<HTMLButtonElement>(".testimonials_arrow")].map((button) => {
            const layers = [...button.querySelectorAll<HTMLElement>(".btn_bg-solid, .btn_bg-item")];
            const [outPath, inPath] = [...button.querySelectorAll<SVGPathElement>(".testimonials_glyph path")];
            const link = () =>
              layers.forEach((layer, i) =>
                layer.style.setProperty("--next", layers[i + 1]?.style.getPropertyValue("--progress") || "0"),
              );
            const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.inOut", duration: 1 }, onUpdate: link });
            layers.slice(1).forEach((layer, i) => {
              tl.fromTo(layer, { "--progress": 0 }, { "--progress": 1, duration: 1.5 }, i * 0.04);
            });
            tl.fromTo(
              outPath,
              { morphSVG: TESTIMONIALS_ARROW_PATHS.default },
              { morphSVG: TESTIMONIALS_ARROW_PATHS.top },
              0,
            );
            tl.fromTo(
              inPath,
              { morphSVG: TESTIMONIALS_ARROW_PATHS.bottom },
              { morphSVG: TESTIMONIALS_ARROW_PATHS.default },
              0.3,
            );
            link();
            const enter = () => tl.timeScale(1.25).play();
            const leave = () => tl.timeScale(1.25).reverse();
            button.addEventListener("mouseenter", enter);
            button.addEventListener("mouseleave", leave);
            return { button, tl, enter, leave };
          })
        : [];

      // Only tick while the section is (nearly) on screen.
      let ticking = false;
      const observer = new IntersectionObserver(
        ([entry]) => {
          slider.isVisible = entry.isIntersecting;
          if (entry.isIntersecting) {
            if (!ticking) gsap.ticker.add(tick);
            ticking = true;
            wait = 0;
            wake();
          } else {
            gsap.ticker.remove(tick);
            ticking = false;
          }
        },
        { rootMargin: "100px 0px" },
      );
      observer.observe(section);

      return () => {
        gsap.ticker.remove(tick);
        observer.disconnect();
        splits.forEach((split) => split.revert());
        slider.destroy();
        apiRef.current = null;
        track.removeEventListener("pointerdown", onDown);
        track.removeEventListener("click", onClick);
        track.removeEventListener("wheel", onWheel);
        section.removeEventListener("keydown", onKey);
        stage.removeEventListener("mouseenter", onEnter);
        stage.removeEventListener("mouseleave", onLeave);
        section.removeEventListener("focusin", onFocus);
        section.removeEventListener("focusout", onBlur);
        hovers.forEach(({ button, tl, enter, leave }) => {
          tl.kill();
          button.removeEventListener("mouseenter", enter);
          button.removeEventListener("mouseleave", leave);
        });
        slides.forEach(({ paper, wire, img }) => {
          for (const el of [paper, wire]) {
            el.style.removeProperty("visibility");
            el.style.removeProperty("clip-path");
          }
          img?.style.removeProperty("transform");
        });
        strip.style.removeProperty("transform");
      };
    },
    stageRef,
    [],
  );

  return (
    <div ref={stageRef} className="testimonials_stage relative mt-60 s:mt-40">
      <div className="testimonials_frame pointer-events-none absolute inset-x-0 top-0 z-2" aria-hidden="true">
        <span className="testimonials_hline top-0" />
        <span className="testimonials_hline bottom-0" />
        {(["is-inner", "is-outer"] as const).flatMap((kind) =>
          [-1, 1].map((side) => (
            <span
              key={`${kind}${side}`}
              className={`testimonials_vline ${kind}`}
              style={{ "--side": side } as CSSProperties}
            />
          )),
        )}
      </div>
      <div className="testimonials_track flex" data-total={TOTAL}>
        {SLIDES.map((testimonial, i) => (
          <div
            key={i}
            className="testimonials_slide shrink-0"
            role="group"
            aria-roledescription="slide"
            aria-label={`${(i % TOTAL) + 1} of ${TOTAL}`}
            aria-hidden={i !== active || undefined}
          >
            <TestimonialCard testimonial={testimonial} />
          </div>
        ))}
      </div>
      <div className="testimonials_nav relative z-3 flex items-center justify-center gap-10">
        <TestimonialsArrow dir="prev" onClick={() => apiRef.current?.prev()} />
        <TestimonialsArrow dir="next" onClick={() => apiRef.current?.next()} />
        <div className="testimonials_counter label flex items-center justify-center gap-2" aria-hidden="true">
          <span className="testimonials_digits block overflow-clip">
            <span className="testimonials_strip block">
              {DIGITS.map((digit, i) => (
                <span key={i} className="block">
                  {digit}
                </span>
              ))}
            </span>
          </span>
          <span>/</span>
          <span>{String(TOTAL).padStart(2, "0")}</span>
        </div>
      </div>
      <p className="sr-only" aria-live="polite" data-status>
        {status} of {TOTAL}
      </p>
    </div>
  );
}
