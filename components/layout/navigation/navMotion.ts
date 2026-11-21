"use client";

import { ScrollTrigger, type registerGsap } from "@/lib/gsap";
import { NAV_MOTION } from "@/constants/navigation";
import { MEDIA } from "@/constants/motion";
import { isNavHeld, onNavReveal } from "@/lib/loader-events";

type Gsap = ReturnType<typeof registerGsap>;

const px = (value: string) => parseFloat(value) || 0;

/**
 * Port of the original `Nav` module: publishes `--nav-height` / `--nav-offset`
 * on <body> and shrinks the bar ("mini") once the page is scrolled.
 */
export function setupNavMini(gsap: Gsap, nav: HTMLElement): () => void {
  const bar = nav.querySelector<HTMLElement>(".nav_bar")!;
  let tl: gsap.core.Timeline | undefined;
  let isMini = false;
  let destroyed = false;

  const setSize = () => {
    const rect = nav.getBoundingClientRect();
    document.body.style.setProperty("--nav-height", `${bar.scrollHeight}px`);
    document.body.style.setProperty("--nav-offset", `${rect.top}px`);
  };

  const build = () => {
    const progress = tl?.progress() ?? 0;
    tl?.progress(0).kill();

    const inner = bar.firstElementChild as HTMLElement;
    const btn = inner.querySelector<HTMLElement>(".btn");
    const text = btn?.querySelector<HTMLElement>(".btn_text-wrapper");
    const arrow = btn?.querySelector<HTMLElement>(".btn_arrow-parent");
    const icon = arrow?.querySelector<HTMLElement>(".btn_arrow-icon");
    if (!btn || !text || !arrow || !icon) return;

    gsap.set([inner, text], { clearProps: "padding" });
    const padY = px(getComputedStyle(text).paddingTop);
    const padX = px(getComputedStyle(text).paddingLeft);
    const height = text.offsetHeight;
    const miniHeight = height - 2 * padY * (1 - NAV_MOTION.miniButton);
    gsap.set(arrow, { width: (height * 51) / 60 });

    const barPad = Math.min(
      px(getComputedStyle(inner).paddingRight),
      (px(getComputedStyle(document.body).fontSize) / 16) * NAV_MOTION.miniPad,
    );
    const k = NAV_MOTION.miniButton;
    const ease = { duration: 0.4, ease: "power3.inOut", autoRound: false };

    tl = gsap
      .timeline({ paused: true })
      .to(inner, { paddingTop: barPad, paddingBottom: barPad, paddingRight: barPad, ...ease }, 0)
      .to(text, { paddingTop: padY * k, paddingBottom: padY * k, paddingLeft: padX * k, paddingRight: padX * k, ...ease }, 0)
      .to(arrow, { width: (miniHeight * 51) / 60, ...ease }, 0)
      .to(icon, { scale: miniHeight / height, ...ease }, 0)
      .progress(progress);

    if (isMini) tl.play();
    else if (progress) tl.reverse();
  };

  const onScroll = () => {
    const next = isMini ? window.scrollY > NAV_MOTION.miniLeave : window.scrollY > NAV_MOTION.miniEnter;
    if (next === isMini) return;
    isMini = next;
    nav.classList.toggle("is-mini", next);
    if (next) tl?.play();
    else tl?.reverse();
  };

  const onResize = () => {
    if (destroyed) return;
    setSize();
    build();
  };

  setSize();
  build();
  document.fonts.ready.then(onResize);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  onScroll();

  return () => {
    destroyed = true;
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    tl?.kill();
  };
}

/**
 * Port of the original `NavMorph` module: the bar shrinks to a compact pill
 * after a bit of scroll, and morphs into the footer card (panel + legal strip,
 * centred in the viewport) when the outro title reaches the top of the screen.
 */
export function setupNavMorph(gsap: Gsap, nav: HTMLElement): () => void {
  const body = nav.querySelector<HTMLElement>(".nav_body")!;
  const bar = body.querySelector<HTMLElement>(".nav_bar")!;
  const panel = body.querySelector<HTMLElement>(".nav_panel")!;
  const lines = panel.querySelectorAll<HTMLElement>(".nav_line");
  const linesX = panel.querySelectorAll<HTMLElement>(".nav_line-x");
  const linesY = panel.querySelectorAll<HTMLElement>(".nav_line-y");
  const dots = panel.querySelectorAll<HTMLElement>(".nav_dot");
  const legal = nav.querySelector<HTMLElement>(".nav_legal")!;
  const reveals = panel.querySelectorAll<HTMLElement>("[data-overlay-reveal]");
  const trigger = document.querySelector<HTMLElement>("[data-footer-trigger]");
  const opener = document.querySelector<HTMLElement>("[data-footer-open]");

  const dim = { closed: 0, open: 0, openW: 0, barH: 0, shift: 0, legalShift: 0, viewH: 0 };
  let isOpen = false;
  let compact: boolean | undefined;
  let destroyed = false;
  let tl: gsap.core.Timeline | undefined;
  let frame = 0;

  const setCompact = (value: boolean) => {
    if (compact === value) return;
    compact = value;
    body.classList.toggle("is-compact", value);
  };

  const restWidth = () => (compact ? Math.min(legal.offsetWidth, nav.clientWidth) : nav.clientWidth);

  const measure = () => {
    const s = body.style;
    const b = bar.style;
    const saved = { height: s.height, width: s.width, bar: b.height };
    const active = body.classList.contains("is-active");

    body.classList.remove("is-active");
    s.height = "";
    b.height = "";
    dim.closed = body.offsetHeight;
    dim.barH = bar.offsetHeight;
    dim.openW = legal.offsetWidth;

    body.classList.add("is-active");
    s.height = "auto";
    s.width = `${dim.openW}px`;
    b.height = "0px";
    dim.open = body.offsetHeight;

    s.height = saved.height;
    s.width = saved.width;
    b.height = saved.bar;
    body.classList.toggle("is-active", active);

    const total = dim.open + 1 + legal.offsetHeight;
    const top = nav.getBoundingClientRect().top;
    dim.viewH = window.innerHeight;
    const offset = (window.innerHeight - total) / 2;
    dim.shift = offset - top;
    dim.legalShift = offset + dim.open + 1 - top;
  };

  const open = () => {
    if (isOpen || destroyed) return;
    const active = body.classList.contains("is-active");
    measure();
    isOpen = true;
    gsap.set(body, { height: body.offsetHeight, width: body.offsetWidth });
    body.classList.add("is-open", "is-active");
    panel.setAttribute("aria-hidden", "false");
    if (!active) {
      gsap.set(reveals, { autoAlpha: 0, yPercent: 24 });
      gsap.set(legal, { autoAlpha: 0, y: dim.legalShift + 24 });
      gsap.set(linesY, { scaleY: 0 });
      gsap.set(linesX, { scaleX: 0 });
      gsap.set(dots, { scale: 0 });
    }
    tl?.kill();
    tl = gsap
      .timeline()
      .to(bar, { autoAlpha: 0, duration: 0.2, ease: "power2.out" }, 0)
      .to(body, { height: dim.open, width: dim.openW, y: dim.shift, duration: 0.9, ease: "power3.inOut" }, 0.05)
      .to(bar, { height: 0, duration: 0.9, ease: "power3.inOut" }, 0.05)
      .to(reveals, { autoAlpha: 1, yPercent: 0, duration: 0.7, ease: "expo.out", stagger: 0.04 }, 0.45)
      .to(linesY, { scaleY: 1, autoAlpha: 1, duration: 0.8, ease: "power3.inOut" }, 0)
      .to(linesX, { scaleX: 1, autoAlpha: 1, duration: 0.6, ease: "power3.inOut", stagger: 0.15 }, 0.15)
      .to(
        dots,
        { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(3)", stagger: (i: number) => Math.floor(i / 2) * 0.15 },
        0.62,
      )
      .to(legal, { autoAlpha: 1, y: dim.legalShift, duration: 0.6, ease: "expo.out" }, 0.8);
  };

  const close = () => {
    if (!isOpen || destroyed) return;
    isOpen = false;
    body.classList.remove("is-open");
    tl?.kill();
    tl = gsap.timeline({
      onComplete: () => {
        body.classList.remove("is-active");
        panel.setAttribute("aria-hidden", "true");
        gsap.set(body, { clearProps: "height,width,y" });
        gsap.set(bar, { clearProps: "height,opacity,visibility" });
        gsap.set(legal, { clearProps: "y,opacity,visibility" });
        gsap.set([...lines, ...dots], { clearProps: "all" });
      },
    });
    tl.to([legal, ...lines, ...dots], { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0)
      .to(reveals, { autoAlpha: 0, yPercent: 10, duration: 0.25, ease: "power2.in", stagger: { each: 0.01, from: "end" } }, 0)
      .to(body, { height: dim.closed, width: restWidth(), y: 0, duration: 0.6, ease: "power3.inOut" }, 0.1)
      .to(bar, { height: dim.barH, duration: 0.6, ease: "power3.inOut" }, 0.1)
      .to(bar, { autoAlpha: 1, duration: 0.25, ease: "power2.out" }, 0.5);
  };

  const remeasure = () => {
    if (!isOpen) return;
    measure();
    gsap.to(body, { height: dim.open, width: dim.openW, y: dim.shift, duration: 0.5, ease: "expo.inOut", overwrite: "auto" });
    gsap.to(legal, { y: dim.legalShift, duration: 0.5, ease: "expo.inOut", overwrite: "auto" });
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && isOpen) close();
  };
  const onResize = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (window.innerHeight !== dim.viewH) remeasure();
      else if (isOpen) {
        // Width-only resize: snap to the new layout (original `resize()`).
        measure();
        gsap.set(body, { height: dim.open, width: dim.openW, y: dim.shift });
        gsap.set(legal, { y: dim.legalShift });
      }
    });
  };

  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);

  const openTrigger =
    trigger &&
    ScrollTrigger.create({
      trigger: opener ?? trigger,
      start: opener?.dataset.footerOpen || NAV_MOTION.openStart,
      onEnter: open,
      onLeaveBack: close,
    });
  const compactTrigger = ScrollTrigger.create({
    start: NAV_MOTION.compactAt,
    end: "max",
    onUpdate: (self) => setCompact(self.progress > 0),
    onRefresh: (self) => setCompact(self.progress > 0),
  });

  return () => {
    destroyed = true;
    tl?.kill();
    openTrigger?.kill();
    compactTrigger.kill();
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
    cancelAnimationFrame(frame);
  };
}

/**
 * Port of the original `Nav` hold/reveal: while the page loader is up the bar
 * stays above the viewport; on `loopsii:nav-reveal` it slides in (0.6s power3.inOut).
 */
export function setupNavReveal(gsap: Gsap, nav: HTMLElement): () => void {
  const slide = nav.querySelector<HTMLElement>(".nav_slide");
  const bar = nav.querySelector<HTMLElement>(".nav_bar");
  if (!slide || !bar) return () => {};

  const reduce = window.matchMedia(MEDIA.reducedMotion).matches;
  const state = { shown: isNavHeld() ? 0 : 1 };
  let room = 0;
  let tween: gsap.core.Tween | undefined;

  const render = () => {
    slide.style.transform = state.shown === 1 ? "" : `translate3d(0, ${(state.shown - 1) * (room + 20)}px, 0)`;
  };
  const measure = () => {
    room = nav.getBoundingClientRect().top + bar.scrollHeight;
    render();
  };

  measure();
  const off = state.shown === 1
    ? () => {}
    : onNavReveal((rate) => {
        tween = gsap.to(state, {
          shown: 1,
          duration: reduce ? 0 : 0.6,
          ease: "power3.inOut",
          overwrite: true,
          onUpdate: render,
        });
        tween.timeScale(rate);
      });
  window.addEventListener("resize", measure);

  return () => {
    off();
    tween?.kill();
    window.removeEventListener("resize", measure);
    slide.style.transform = "";
  };
}
