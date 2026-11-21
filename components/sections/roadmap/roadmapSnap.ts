import type Lenis from "lenis";
import { gsap } from "@/lib/gsap";
import { MEDIA } from "@/constants/motion";
import { ROADMAP_SNAP } from "@/constants/roadmap";

const TOUCH_EVENTS = ["touchstart", "touchend", "touchcancel"] as const;

/**
 * Port of the original idle-snap helper: once Lenis stops receiving input for
 * `idle` ms while active, glide to the nearest stop (biased by direction).
 */
export class RoadmapSnap {
  private off: (() => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private dir = 1;
  private touching = false;
  private readonly reduce: boolean;
  private readonly onTouch?: (e: TouchEvent) => void;

  constructor(
    private readonly getLenis: () => Lenis | null,
    private readonly stops: () => number[],
    touch: boolean,
  ) {
    this.reduce = window.matchMedia(MEDIA.reducedMotion).matches;
    if (touch) {
      this.onTouch = (e) => {
        this.touching = e.type === "touchstart";
        if (!this.touching) this.arm();
      };
      TOUCH_EVENTS.forEach((t) => window.addEventListener(t, this.onTouch!, { passive: true }));
    }
  }

  watch(active: boolean) {
    this.off?.();
    this.off = null;
    clearTimeout(this.timer);
    const lenis = this.getLenis();
    if (!active || this.reduce || !lenis) return;
    let last = lenis.targetScroll;
    this.dir = lenis.direction || 1;
    const onScroll = () => {
      if (lenis.targetScroll !== last) {
        this.dir = Math.sign(lenis.targetScroll - last);
        last = lenis.targetScroll;
        this.arm();
      }
    };
    this.off = lenis.on("scroll", onScroll);
    this.arm();
  }

  private arm() {
    if (!this.off) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.snap(), ROADMAP_SNAP.idle);
  }

  private snap() {
    const lenis = this.getLenis();
    if (this.touching || !lenis || lenis.isStopped || lenis.isLocked) return;
    const stops = this.stops();
    const target = lenis.targetScroll;
    const i = stops.findIndex((s) => s > target);
    if (i < 1) return;
    const from = stops[i - 1];
    const span = stops[i] - from;
    const p = (target - from) / span;
    const to = (this.dir > 0 ? p > ROADMAP_SNAP.pass : 1 - p <= ROADMAP_SNAP.pass) ? stops[i] : from;
    const dist = Math.abs(to - target);
    if (dist > 1) {
      lenis.scrollTo(to, {
        duration: gsap.utils.clamp(0.5, ROADMAP_SNAP.time, (dist / span) * 2),
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
      });
    }
  }

  destroy() {
    this.watch(false);
    if (this.onTouch) TOUCH_EVENTS.forEach((t) => window.removeEventListener(t, this.onTouch!));
  }
}
