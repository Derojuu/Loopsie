import type { gsap as GsapType } from "gsap";
import { HERO_FIT, HERO_TITLE_COLORS, HERO_TITLE_MOTION } from "@/constants/hero";
import { MEDIA } from "@/constants/motion";

type Gsap = typeof GsapType;

/**
 * Port of the original `hero` module: fits the hero to the viewport, keeps the
 * corner labels inside the screen and rotates the "your <word>" title every
 * Nth shapes step.
 */
export class HeroTitles {
  private readonly top: HTMLElement | null;
  private readonly bottom: HTMLElement;
  private readonly titles: HTMLElement[];
  private chars: HTMLElement[][] = [];
  private currentIndex = 0;
  private steps = 0;
  private prevAnimation?: gsap.core.Timeline;
  private currentAnimation?: gsap.core.Timeline;
  private labelObserver?: ResizeObserver;
  private destroyed = false;

  constructor(
    private readonly gsap: Gsap,
    private readonly hero: HTMLElement,
  ) {
    this.top = hero.querySelector<HTMLElement>(".hero_top");
    this.bottom = hero.querySelector<HTMLElement>(".hero_bottom")!;
    this.titles = [...hero.querySelectorAll<HTMLElement>(".hero_title")];
    this.fit();
    this.setSize();
    this.labelObserver = new ResizeObserver(() => this.fitLabels());
    this.labelObserver.observe(this.bottom);
    this.setSplits();
  }

  onStep(): void {
    if (this.destroyed) return;
    if (++this.steps % HERO_TITLE_MOTION.everySteps === 0) this.showNext();
  }

  private showNext(): void {
    const { gsap } = this;
    const { durationEnter, durationLeave, stagger, enterDelay } = HERO_TITLE_MOTION;
    this.stop();
    const nextIndex = (this.currentIndex + 1) % this.titles.length;
    const prev = this.chars[this.currentIndex];
    const next = this.chars[nextIndex];

    this.chars.forEach((chars) => {
      if (chars !== prev && chars !== next) {
        gsap.killTweensOf(chars);
        gsap.set(chars, { autoAlpha: 0 });
      }
    });

    if (prev && prev !== next) {
      gsap.set(prev, { "--enter": 0 });
      this.prevAnimation = gsap.timeline({ defaults: { stagger, overwrite: "auto", duration: durationLeave } });
      this.prevAnimation.fromTo(prev, { "--leave": 0 }, { "--leave": 1, autoAlpha: 0, stagger, overwrite: "auto" });
    }

    next.forEach((char) => char.style.setProperty("--deg", `${gsap.utils.random(-8, 8, 2)}deg`));
    this.currentAnimation = gsap.timeline({ defaults: { stagger, overwrite: "auto", duration: durationEnter } });
    gsap.set(next, { "--leave": 0, color: gsap.utils.random([...HERO_TITLE_COLORS]) });
    this.currentAnimation.fromTo(
      next,
      { autoAlpha: 0, "--enter": 1 },
      { autoAlpha: 1, "--enter": 0, stagger, overwrite: "auto", delay: enterDelay },
    );
    this.currentAnimation.to(next, { color: "#000", overwrite: "auto", duration: durationEnter * 0.8 }, "<0.05");
    this.currentIndex = nextIndex;
  }

  private stop(): void {
    this.prevAnimation?.kill();
    this.currentAnimation?.kill();
  }

  /** Re-measures each char so weight/scale tweens never reflow the line. */
  private setSplits(): void {
    const { gsap } = this;
    this.chars = this.titles.map((title) => [...title.querySelectorAll<HTMLElement>(".hero_title-char")]);
    const all = this.chars.flat();
    all.forEach((char) => char.style.removeProperty("width"));
    gsap.set(all, { clearProps: "opacity,visibility,color,--enter,--leave,--deg" });
    this.chars.forEach((chars, i) => i !== 0 && gsap.set(chars, { autoAlpha: 0 }));
    const widths = all.map((char) => char.getBoundingClientRect().width);
    all.forEach((char, i) => char.style.setProperty("width", `${widths[i]}px`));
  }

  /** Desktop: shrink the shapes cell so the whole hero fits the first screen. */
  private fit(): void {
    const style = this.bottom.style;
    style.removeProperty("width");
    style.removeProperty("justify-self");
    this.hero.style.removeProperty("height");
    if (!this.top || !window.matchMedia(MEDIA.desktop).matches) return;

    const cols = parseFloat(getComputedStyle(this.bottom).getPropertyValue("--hero-cols")) || 11;
    const fullCell = (this.bottom.getBoundingClientRect().width + 2) / cols;
    const heroStyle = getComputedStyle(this.hero);
    const rem = parseFloat(getComputedStyle(document.body).fontSize) / 16;
    const available =
      this.hero.clientHeight -
      parseFloat(heroStyle.paddingTop) -
      parseFloat(heroStyle.paddingBottom) -
      this.top.offsetHeight;
    const cell = Math.min(
      fullCell,
      Math.max(fullCell * HERO_FIT.minCellRatio, (available - HERO_FIT.gap * rem) / HERO_FIT.rows),
    );
    style.setProperty("--cell", `${cell}px`);
    if (cell < fullCell) {
      style.width = `${cell * cols - 2}px`;
      style.justifySelf = "center";
      return;
    }
    const spare = available - cell * HERO_FIT.rows - HERO_FIT.slack * rem;
    if (spare > 0) this.hero.style.height = `${this.hero.clientHeight - spare / 2}px`;
  }

  private setSize(): void {
    const rect = this.bottom.getBoundingClientRect();
    this.hero.style.setProperty("--bottom-left", `${-rect.left}px`);
    this.bottom.style.setProperty("--offset-top", `${this.bottom.offsetTop}px`);
  }

  /** Scales the corner labels down when they would overflow the viewport. */
  private fitLabels(): void {
    const labels = [...this.hero.querySelectorAll<HTMLElement>(".hero_label-text")];
    if (!labels.length) return;
    this.hero.classList.remove("is-label-fit");
    const viewport = document.documentElement.clientWidth;
    const box = this.bottom.getBoundingClientRect();
    const frame =
      this.bottom.querySelector(".hero_bottom-absolute-parent")?.getBoundingClientRect() ?? box;
    const ratio = Math.min(
      1,
      ...labels.map((label) => {
        const rect = label.getBoundingClientRect();
        if (!rect.width) return 1;
        const isLeft = rect.left + rect.width / 2 < viewport / 2;
        const offset = parseFloat(getComputedStyle(label)[isLeft ? "right" : "left"]) || 0;
        const room = isLeft ? rect.right - (frame.left - box.left) : viewport - rect.left - (box.right - frame.right);
        return (room - offset) / rect.width;
      }),
    );
    if (ratio >= 1) return;
    this.hero.style.setProperty("--label-size", `${parseFloat(getComputedStyle(labels[0]).fontSize) * ratio}px`);
    this.hero.classList.add("is-label-fit");
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.labelObserver?.disconnect();
    this.stop();
    this.chars.flat().forEach((char) => char.style.removeProperty("width"));
    this.hero.classList.remove("is-label-fit");
  }
}
