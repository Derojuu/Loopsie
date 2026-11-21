"use client";

import type { AnimationItem } from "lottie-web";
import type Lenis from "lenis";
import { SplitText, type registerGsap } from "@/lib/gsap";
import { emitLoaded, emitNavReveal, emitRevealed } from "@/lib/loader-events";
import { MEDIA } from "@/constants/motion";
import { measureBounds, mountLottie } from "./lottie";

type Gsap = ReturnType<typeof registerGsap>;

const EASE = "power3.inOut";
const LOGO_LEFT = "/lotties/logo-left.json";
const LOGO_RIGHT = "/lotties/logo-right.json";
const LOGO_LOOP = "/lotties/logo-loop.json";

/** Lottie artboard (445x383) and the loop cell reference width (300). */
const ART_W = 445;
const ART_H = 383;
const CELL_REF = 300;
/** Logo width relative to a hero loop cell (x2 on phones). */
const MARK_SCALE = 0.36;
const PHONE_MARK_FACTOR = 2;
/** Frame the logo animations play to / the loop is parked on. */
const LOOP_FRAME = 21;
const HOLD_FRAME = 20;
/** Loader box size in spacing units (desktop / phone). */
const BOX_DESKTOP = 290;
const BOX_PHONE = 150;
/** Hand-off delay and logo-to-hero cross-over duration (seconds). */
const HAND_OFF_AT = 1.4;
const CROSS_DURATION = 0.9;
/** Earlier start of the hero reveal when the loader is skipped (`is-repeat`). */
const REPEAT_SHIFT = 0.8;
/** Moment the loader chrome is dropped after the hand-off starts. */
const DROP_AT = 1.5;

const root = () => document.documentElement;
const spacing = () => parseFloat(getComputedStyle(document.body).fontSize) / 16;

type Edge = "l" | "t" | "r" | "b";
interface Anchor {
  key: Edge;
  off: number;
  set: (value: number) => void;
}
type AnchorSpec = [HTMLElement, Edge | null, Edge | null];

/** Releases the page (scroll, nav, hero) without any animation. Safety net for failures. */
export function forceFinish(getLenis: () => Lenis | null): void {
  const main = document.querySelector<HTMLElement>("main");
  if (main) main.style.visibility = "visible";
  root().classList.remove("is-loading");
  getLenis()?.start();
  emitNavReveal();
  emitLoaded();
  document.querySelectorAll<HTMLElement>("[data-loader], .loader_logo, .loader_right").forEach((el) => {
    el.hidden = true;
  });
  root().classList.remove("is-repeat");
}

/** Port of the original loader (`Rs`): intro frame + counter, logo hand-off into the hero, page release. */
export class PageLoader {
  private readonly sheet: HTMLElement;
  private readonly box: HTMLElement;
  private readonly frame: HTMLElement;
  private readonly dots: HTMLElement[];
  private readonly linesX: HTMLElement[];
  private readonly linesY: HTMLElement[];
  private readonly counter: HTMLElement;
  private readonly counterValue: HTMLElement | null;
  private readonly logo: HTMLElement;
  private readonly left: HTMLElement | null;
  private readonly right: HTMLElement | null;
  private readonly main: HTMLElement;
  private readonly hero: HTMLElement | null;
  private readonly reduce: boolean;
  private readonly rate = 1;
  private readonly repeat: boolean;
  private readonly progress: { value: number };
  private readonly work = { value: 0 };
  private readonly entered: Promise<void>;
  private done = false;
  private dead = false;
  private anims?: (AnimationItem | null)[];
  private square = { left: 0, top: 0, width: 0, height: 0 };
  private mark = { left: 0, top: 0, width: 0, height: 0 };

  constructor(
    private readonly gsap: Gsap,
    private readonly instance: HTMLElement,
    private readonly getLenis: () => Lenis | null,
  ) {
    const q = <T extends HTMLElement>(selector: string) => instance.querySelector<T>(selector);
    const qa = (selector: string) => [...instance.querySelectorAll<HTMLElement>(selector)];
    this.sheet = q(".loader_sheet")!;
    this.box = q(".loader_box")!;
    this.frame = q(".loader_frame")!;
    this.dots = qa(".loader_dot");
    this.linesX = qa(".loader_line-x");
    this.linesY = qa(".loader_line-y");
    this.counter = q(".loader_counter")!;
    this.counterValue = q(".loader_counter-value");
    this.logo = document.querySelector<HTMLElement>(".loader_logo")!;
    this.left = this.logo?.querySelector<HTMLElement>(".loader_left") ?? null;
    this.right = document.querySelector<HTMLElement>(".loader_right");
    this.main = document.querySelector<HTMLElement>("main")!;
    this.hero = this.main?.querySelector<HTMLElement>(".hero_bottom") ?? null;
    this.reduce = window.matchMedia(MEDIA.reducedMotion).matches;
    this.repeat = root().classList.contains("is-repeat");
    const animated = !!(this.hero && this.left && this.right) && !this.reduce;
    this.progress = { value: animated ? 0 : 100 };
    this.entered = this.hero && this.left && this.right && !this.repeat ? this.enter() : Promise.resolve();
  }

  destroy(): void {
    this.dead = true;
  }

  private count(): void {
    const value = Math.min(Math.round(this.progress.value), Math.round(this.work.value));
    if (this.counterValue) this.counterValue.textContent = String(value).padStart(3, "0");
  }

  /** Real loading progress (0..1) shown by the counter (never ahead of the intro animation). */
  setWork(amount: number): Promise<void> {
    if (this.repeat) return Promise.resolve();
    return new Promise((resolve) => {
      this.gsap.to(this.work, {
        value: amount * 100,
        duration: 0.4,
        ease: "power1.out",
        overwrite: true,
        onUpdate: () => this.count(),
        onComplete: () => resolve(),
      });
    });
  }

  private travels(): boolean {
    const lines = this.main.querySelector<HTMLElement>(".hero_bottom-lines");
    return !!lines && getComputedStyle(lines).getPropertyValue("--hero-travel").trim() !== "0";
  }

  private landingMark(): HTMLElement | null {
    return this.main.querySelector<HTMLElement>(this.travels() ? ".intro_mark" : ".hero-el_mark");
  }

  /** Preloads the lottie the logo lands on. */
  warm(): Promise<unknown> {
    if (!this.hero || !this.main.querySelector(".hero_bottom-lines")) return Promise.resolve();
    const mark = this.landingMark();
    return mark ? mountLottie(mark, { path: LOGO_LOOP, frame: LOOP_FRAME }) : Promise.resolve();
  }

  /** Centres the loader box and positions the logo overlays at the hero loop-cell mark size. */
  private place(): void {
    const hero = this.hero!.getBoundingClientRect();
    const phone = window.matchMedia(MEDIA.phone).matches;
    const size = Math.min((phone ? BOX_PHONE : BOX_DESKTOP) * spacing(), hero.width);
    this.square = {
      left: (window.innerWidth - size) / 2,
      top: (window.innerHeight - size) / 2,
      width: size,
      height: size,
    };
    Object.assign(this.box.style, {
      left: `${this.square.left}px`,
      top: `${this.square.top}px`,
      width: `${size}px`,
      height: `${size}px`,
    });

    const cell = this.main.querySelector<HTMLElement>(".hero-el_loop")?.getBoundingClientRect().width || hero.width / 11;
    const width = ((phone ? PHONE_MARK_FACTOR : 1) * MARK_SCALE * cell * ART_W) / CELL_REF;
    const height = (width * ART_H) / ART_W;
    this.mark = {
      width,
      height,
      left: this.square.left + (size - width) / 2,
      top: this.square.top + (size - height) / 2,
    };
    for (const el of [this.logo, this.right!]) {
      Object.assign(el.style, {
        left: `${this.mark.left}px`,
        top: `${this.mark.top}px`,
        width: `${width}px`,
        height: `${height}px`,
      });
    }
  }

  private async enter(): Promise<void> {
    const { gsap } = this;
    this.place();
    this.instance.classList.add("is-ready");
    this.logo.classList.add("is-ready");
    this.right!.classList.add("is-ready");

    const loading = Promise.all([
      mountLottie(this.left!, { path: LOGO_LEFT }),
      mountLottie(this.right!, { path: LOGO_RIGHT }),
    ]);
    if (this.reduce) {
      this.anims = await loading;
      this.anims.forEach((anim) => anim?.goToAndStop(HOLD_FRAME, true));
      return;
    }

    const inset = spacing() * 40;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const corners = [
      [inset, inset],
      [w - inset, inset],
      [w - inset, h - inset],
      [inset, h - inset],
    ];
    this.dots.forEach((dot, i) => {
      const rect = dot.getBoundingClientRect();
      gsap.set(dot, { x: corners[i][0] - (rect.left + rect.width / 2), y: corners[i][1] - (rect.top + rect.height / 2) });
    });
    gsap.set(this.linesX, { scaleX: 0 });
    gsap.set(this.linesY, { scaleY: 0 });
    gsap.set(this.counter, { autoAlpha: 0 });

    const tl = gsap.timeline().timeScale(this.rate);
    tl.to(this.dots, { x: 0, y: 0, duration: 1.1, ease: EASE, stagger: 0.04 }, 0.1);
    tl.to(this.linesY, { scaleY: 1, duration: 1, ease: EASE }, 0.55);
    tl.to(this.linesX, { scaleX: 1, duration: 1, ease: EASE }, 0.65);
    tl.to(this.frame, { opacity: 1, duration: 0.4, ease: "power2.out" }, 1.2);
    tl.to(this.counter, { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 0.3);
    tl.to(this.progress, { value: 100, duration: 1.9, ease: "power2.inOut", onUpdate: () => this.count() }, 0.3);

    let logoPlayed: Promise<unknown> = Promise.resolve();
    tl.call(
      () => {
        logoPlayed = loading.then((anims) => this.playLogo(anims));
      },
      undefined,
      0.9,
    );
    await tl.then();
    await logoPlayed;
  }

  private playLogo(anims: (AnimationItem | null)[]): Promise<unknown> {
    this.anims = anims;
    return Promise.all(
      anims.map((anim) =>
        anim
          ? new Promise<void>((resolve) => {
              anim.addEventListener("complete", () => resolve());
              anim.setSpeed(this.rate);
              anim.playSegments([anim.firstFrame, anim.firstFrame + LOOP_FRAME], true);
            })
          : Promise.resolve(),
      ),
    );
  }

  async exit(): Promise<void> {
    const { gsap } = this;
    await this.entered;
    if (this.dead) return;
    if (this.done || !this.hero || !this.left) return this.finish();
    this.done = true;

    const hero = this.hero.getBoundingClientRect();
    const top = this.main.querySelector<HTMLElement>(".hero_top");
    const topLine = this.main.querySelector<HTMLElement>(".hero_top-line");
    const lines = this.main.querySelector<HTMLElement>(".hero_bottom-lines");
    if (!top || !topLine || !lines) return this.finish();
    const labels = [...this.main.querySelectorAll<HTMLElement>(".hero_label")];
    const labelTexts = [...this.main.querySelectorAll<HTMLElement>(".hero_label-text")];
    const travels = this.travels();
    const landing = this.landingMark();
    if (landing) await mountLottie(landing, { path: LOGO_LOOP, frame: LOOP_FRAME });
    if (this.dead) return;

    this.getLenis()?.scrollTo(0, { immediate: true, force: true });

    if (this.reduce) {
      this.main.style.visibility = "visible";
      await gsap.to(this.instance, { autoAlpha: 0, duration: 0.3 });
      return this.finish();
    }

    const split = this.splitHero(top);
    const cells = [...this.main.querySelectorAll<HTMLElement>(".hero-el_cell:not(.hero-el_loop)")];
    const centerX = hero.left + hero.width / 2;
    const distances = cells.map((cell) => {
      const rect = cell.getBoundingClientRect();
      return Math.hypot(rect.left + rect.width / 2 - centerX, rect.top + rect.height / 2 - (hero.top + hero.height / 2));
    });
    const maxDistance = Math.hypot(hero.width / 2, hero.height / 2);
    gsap.set(cells, { "--s": 0 });

    const lineRect = topLine.getBoundingClientRect();
    gsap.set(topLine, { scaleX: 0, transformOrigin: "0 50%" });
    gsap.set([...labels, lines], { autoAlpha: 0 });
    gsap.set(labelTexts, { autoAlpha: 0, y: 6 });
    if (landing && !this.repeat) gsap.set(landing, { autoAlpha: 0 });
    this.main.style.visibility = "visible";
    this.instance.classList.add("is-clear");
    if (this.repeat) this.uncover();

    const shift = this.repeat ? REPEAT_SHIFT : 0;
    const handOffAt = this.repeat ? 0 : HAND_OFF_AT;
    const parsed = gsap.parseEase(EASE);
    /** Time at which the travelling logo crosses page x (inverse of the hand-off ease). */
    const crossAt = (x: number) => {
      const target = gsap.utils.clamp(0, 1, (x - lineRect.left) / lineRect.width);
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 20; i++) {
        if (parsed((lo + hi) / 2) < target) lo = (lo + hi) / 2;
        else hi = (lo + hi) / 2;
      }
      return handOffAt + CROSS_DURATION * hi;
    };

    const tl = gsap.timeline().timeScale(this.rate);
    if (this.repeat) tl.to([...labels, lines], { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, 0);
    else this.handOff(tl, { hero, landing, labels, lines, crossAt });

    const bg = this.main.querySelector<HTMLElement>(travels ? ".intro_logo-bg" : ".hero-el_loop");
    const prop = travels ? "scale" : "--s";
    const popped = [bg, this.repeat && travels && landing].filter(Boolean) as HTMLElement[];
    if (bg) {
      gsap.set(popped, { [prop]: 0 });
      tl.to(popped, { [prop]: 1, duration: 0.7, ease: "back(1.2)" }, 0.8 - shift);
    }
    tl.to(
      cells,
      { "--s": 1, duration: 0.7, ease: "back(1.2)", stagger: (i: number) => Math.min(1, distances[i] / maxDistance) * 0.45 },
      0.85 - shift,
    );
    tl.call(() => emitRevealed(), undefined, ">");
    tl.call(() => this.release(), undefined, this.repeat ? 0 : DROP_AT);
    tl.call(() => emitNavReveal(this.rate), undefined, this.repeat ? 0 : DROP_AT + 0.1);

    const rise = (groups: HTMLElement[][], at: number | string) =>
      groups.forEach((group, n) => {
        // Matches the original: a string position gets the per-group offset appended as text.
        const position = typeof at === "string" ? at + n * 0.08 : at + n * 0.08;
        tl.to(group, { yPercent: 0, duration: 1, ease: "power4", stagger: 0.04 }, position);
      });
    rise(split.title, Math.max(0, crossAt(hero.left) - 0.25));
    rise(split.copy, "<0.2");
    tl.to(topLine, { scaleX: 1, duration: CROSS_DURATION, ease: EASE }, handOffAt);
    tl.to(labelTexts, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.05 }, 1.7 - shift);

    await tl.then();
    if (this.dead) return;
    split.revert();
    gsap.set([topLine, ...labels, ...labelTexts, lines], { clearProps: "all" });
    if (landing) gsap.set(landing, { clearProps: "opacity,visibility,transform" });
    if (bg) gsap.set(bg, { clearProps: travels ? "all" : "--s" });
    this.finish();
  }

  /** Logo flies into the hero loop cell while the frame lines expand onto the hero grid and the sheet lifts. */
  private handOff(
    tl: gsap.core.Timeline,
    {
      hero,
      landing,
      labels,
      lines,
      crossAt,
    }: {
      hero: DOMRect;
      landing: HTMLElement | null;
      labels: HTMLElement[];
      lines: HTMLElement;
      crossAt: (x: number) => number;
    },
  ): void {
    const bounds = measureBounds(this.left!);
    const target = landing ? measureBounds(landing) : null;
    const fromX = bounds ? bounds.cx : this.mark.left + this.mark.width / 2;
    const fromY = bounds ? bounds.cy : this.mark.top + this.mark.height / 2;
    const scale = target && bounds ? target.width / bounds.width : 1;
    const toX = target ? target.cx : hero.left + hero.width / 2;
    const toY = target ? target.cy : hero.top + hero.height / 2;
    const loop = this.anims?.[1];

    tl.to(this.counter, { autoAlpha: 0, duration: 0.3, ease: "power2.in" }, 0);
    tl.call(
      () => {
        if (!loop) return;
        loop.setSpeed(this.rate * 1.5);
        loop.playSegments([loop.firstFrame + HOLD_FRAME, loop.firstFrame], true);
      },
      undefined,
      0,
    );
    tl.to(this.frame, { opacity: 0, duration: 0.5, ease: "power2.out" }, 0.3);

    const trail = this.trail();
    tl.to(
      trail.edges,
      { l: hero.left, t: hero.top, r: hero.right, b: hero.bottom, duration: 0.8, ease: EASE, onUpdate: trail.update },
      0.3,
    );
    tl.to(
      this.logo,
      {
        x: toX - fromX,
        y: toY - fromY,
        scale,
        transformOrigin: `${fromX - this.mark.left}px ${fromY - this.mark.top}px`,
        duration: 0.8,
        ease: EASE,
      },
      0.3,
    );
    tl.to(this.sheet, { yPercent: -100, duration: 1, ease: EASE }, 0.6);
    tl.set([...labels, lines], { autoAlpha: 1 }, DROP_AT);
    tl.set([...this.linesX, this.frame, ...this.dots], { autoAlpha: 0 }, DROP_AT);
    if (landing) tl.set(landing, { autoAlpha: 1 }, DROP_AT);
    tl.set(this.logo, { autoAlpha: 0 }, DROP_AT);

    const heroYLine = lines.querySelector<HTMLElement>(".hero_bottom-y-line");
    const grow = this.linesY.map(() => ({ t: 0 }));
    const updateClip = () => {
      const y = heroYLine?.getBoundingClientRect().top || 0;
      this.linesY.forEach((el, i) => {
        el.style.clipPath = `inset(0 0 ${el.getBoundingClientRect().bottom - y * (1 - grow[i].t)}px 0)`;
      });
    };
    tl.eventCallback("onUpdate", () => {
      if (tl.time() >= DROP_AT) updateClip();
    });
    grow.forEach((state, i) =>
      tl.to(state, { t: 1, duration: 0.4, ease: "power3.out" }, crossAt(i ? hero.right : hero.left)),
    );
  }

  /** Moves the frame lines, corner dots and frame box with the interpolated hero rectangle. */
  private trail(): { edges: Record<Edge, number>; update: () => void } {
    const { gsap } = this;
    const dpr = window.devicePixelRatio || 1;
    const snap = (value: number) => Math.round(value * dpr) / dpr;
    const { left, top, width, height } = this.square;
    const start: Record<Edge, number> = { l: left, t: top, r: left + width, b: top + height };
    const edges = { ...start };

    const anchor = (el: HTMLElement, key: Edge | null, side: "left" | "top"): Anchor | null =>
      key && {
        key,
        off: el.getBoundingClientRect()[side] - start[key],
        set: gsap.quickSetter(el, side === "left" ? "x" : "y", "px") as (value: number) => void,
      };

    const specs: AnchorSpec[] = [
      ...this.linesX.map((el, i): AnchorSpec => [el, null, i ? "b" : "t"]),
      ...this.linesY.map((el, i): AnchorSpec => [el, i ? "r" : "l", null]),
      ...this.dots.map((el, i): AnchorSpec => [el, i === 1 || i === 2 ? "r" : "l", i < 2 ? "t" : "b"]),
      [this.frame, "l", "t"],
    ];
    const anchors = specs.map(([el, x, y]) => [anchor(el, x, "left"), anchor(el, y, "top")] as const);

    const f = this.frame.getBoundingClientRect();
    const frameOff = { l: f.left - start.l, t: f.top - start.t, r: f.right - start.r, b: f.bottom - start.b };
    const setW = gsap.quickSetter(this.frame, "width", "px") as (value: number) => void;
    const setH = gsap.quickSetter(this.frame, "height", "px") as (value: number) => void;
    const apply = (a: Anchor | null) => a?.set(snap(edges[a.key] + a.off) - snap(start[a.key] + a.off));

    return {
      edges,
      update: () => {
        anchors.forEach(([x, y]) => {
          apply(x);
          apply(y);
        });
        setW(snap(edges.r + frameOff.r) - snap(edges.l + frameOff.l));
        setH(snap(edges.b + frameOff.b) - snap(edges.t + frameOff.t));
      },
    };
  }

  /** Splits the hero title / subtitle so they can rise in line by line. */
  private splitHero(top: HTMLElement): { title: HTMLElement[][]; copy: HTMLElement[][]; revert: () => void } {
    const { gsap } = this;
    const [first, second] = (top.querySelector(".h1")?.children ?? []) as unknown as (HTMLElement | undefined)[];
    const subtitle = top.querySelector<HTMLElement>("h2");
    const splitTitle = first ? new SplitText(first, { type: "words", aria: "none" }) : null;
    const splitCopy = subtitle ? new SplitText(subtitle, { type: "lines, words" }) : null;

    const lineEls = (splitCopy?.lines ?? []) as HTMLElement[];
    const clipped = [first, second, ...lineEls].filter(Boolean) as HTMLElement[];
    const title = [splitTitle?.words as HTMLElement[] | undefined, second && ([...second.children] as HTMLElement[])].filter(
      Boolean,
    ) as HTMLElement[][];
    const copy = lineEls.map((line) => [...line.children] as HTMLElement[]);
    const all = [...title, ...copy].flat();

    gsap.set(clipped, { clipPath: "inset(-50% -100vw -0.2em -100vw)" });
    gsap.set(all, { yPercent: 130 });

    return {
      title,
      copy,
      revert: () => {
        gsap.set([...clipped, ...all], { clearProps: "clipPath,transform" });
        splitTitle?.revert();
        splitCopy?.revert();
      },
    };
  }

  private release(): void {
    root().classList.remove("is-loading");
    this.getLenis()?.start();
  }

  finish(): void {
    this.main.style.visibility = "visible";
    this.release();
    emitNavReveal();
    emitLoaded();
    this.anims?.forEach((anim) => anim?.destroy());
    this.uncover();
  }

  private uncover(): void {
    this.instance.hidden = true;
    this.logo.hidden = true;
    if (this.right) this.right.hidden = true;
    root().classList.remove("is-repeat");
  }
}
