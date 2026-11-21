import type { FeatureIconId } from "@/constants/features";
import { CustomEase, type gsap as Gsap } from "@/lib/gsap";

/**
 * Looping feature-icon animations, ported 1:1 from the original `FeatureIcon`
 * module (After Effects exports driven by `data-l` / `data-x` … attributes).
 */

type GsapApi = typeof Gsap;
type Animation = gsap.core.Animation;

/** One After Effects frame at 30fps. */
const F = 1 / 30;

const ease = (name: string, curve: string) => CustomEase.get(name) || CustomEase.create(name, curve);

interface Layer {
  el: Element;
  x: number;
  y: number;
  r: number;
  sx: number;
  sy: number;
  apply: () => void;
}

function layer(el: Element): Layer {
  const d = (el as SVGElement).dataset;
  const l: Layer = {
    el,
    x: +(d.x ?? 0),
    y: +(d.y ?? 0),
    r: +(d.r ?? 0),
    sx: +(d.sx ?? 1),
    sy: +(d.sy ?? 1),
    apply: () => el.setAttribute("transform", `translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.sx} ${l.sy})`),
  };
  return l;
}

const all = (root: Element, sel: string) => [...root.querySelectorAll(sel)];
const one = (root: Element, name: string) => layer(root.querySelector(`[data-l="${name}"]`)!);
const many = (root: Element, sel: string) => all(root, sel).map(layer);
const withApply = (target: Layer | Layer[], vars: gsap.TweenVars): gsap.TweenVars => ({
  ...vars,
  onUpdate: () => (Array.isArray(target) ? target.forEach((t) => t.apply()) : target.apply()),
});

type Builder = (gsap: GsapApi, root: SVGSVGElement) => Animation;

const spin: Builder = (gsap, root) => {
  const v = one(root, "Vector");
  return gsap.to(v, withApply(v, { r: "+=360", duration: 360 / 69, ease: "none", repeat: -1 }));
};

const loop =
  (
    name: string,
    prop: "x" | "y",
    from: number,
    to: number,
    duration: number,
    easing: gsap.EaseString | gsap.EaseFunction = "none",
    repeatDelay = 0,
  ): Builder =>
  (gsap, root) => {
    const l = one(root, name);
    l[prop] = from;
    l.apply();
    return gsap.to(l, withApply(l, { [prop]: to, duration, ease: easing, repeat: -1, repeatDelay }));
  };

interface TrimStep {
  from: string;
  to: string;
  duration: number;
  ease: gsap.EaseFunction;
}

const trim =
  (steps: TrimStep[]): Builder =>
  (gsap, root) => {
    const path = root.querySelector("[data-trim] path");
    const tl = gsap.timeline({ repeat: -1 });
    gsap.set(path, { drawSVG: steps[0].from });
    steps.forEach(({ from, to, duration, ease: e }) =>
      tl.fromTo(path, { drawSVG: from }, { drawSVG: to, duration, ease: e, immediateRender: false }),
    );
    return tl;
  };

const spread = (layers: Layer[], gap: number) => {
  layers.sort((a, b) => a.x - b.x);
  const first = layers[0].x;
  layers.forEach((l, i) => {
    l.x = first + i * gap;
    l.apply();
  });
};

function builders(): Record<FeatureIconId, Builder> {
  const aeOut = ease("aeOut", ".33,0,.25,1");
  const aeInOut = ease("aeInOut", ".33,0,.67,1");
  const aeIn = ease("aeIn", ".75,0,.67,1");
  const aeSine = ease("aeSine", ".25,0,.75,1");
  const aeStrong = ease("aeStrong", ".75,0,.83,1");

  return {
    reusable: spin,
    "final-invoice": spin,
    "follow-ups": spin,
    agreements: trim([
      { from: "0% 0%", to: "0% 100%", duration: 36.67 * F, ease: aeOut },
      { from: "0% 100%", to: "100% 100%", duration: 18.33 * F, ease: aeOut },
    ]),
    "todays-plate": trim([
      { from: "100% 100%", to: "0% 100%", duration: 25.1 * F, ease: aeSine },
      { from: "0% 100%", to: "0% 0%", duration: 26.9 * F, ease: aeOut },
    ]),
    deliverables: trim([
      { from: "100% 100%", to: "0% 100%", duration: 25.44 * F, ease: aeSine },
      { from: "0% 100%", to: "0% 0%", duration: 25.56 * F, ease: aeSine },
    ]),
    "deposit-invoice": (gsap, root) => {
      const bars = many(root, '[clip-path] [data-l^="Vector"]');
      bars.sort((a, b) => a.x - b.x);
      const offsets = [0, 36, 90, 160, 255, 349, 420, 474];
      const scales = [0.97, 1.83, 2.38, 3.18, 4.19, 3.18, 2.38, 1.83];
      const xAt = (i: number) => -589 + 509 * Math.floor(i / 8) + offsets[i % 8];
      const sAt = (i: number) => scales[i % 8];
      const state = { p: 0 };
      const update = () =>
        bars.forEach((b, i) => {
          b.x = xAt(i) + (xAt(i + 4) - xAt(i)) * state.p;
          b.sx = sAt(i) + (sAt(i + 4) - sAt(i)) * state.p;
          b.apply();
        });
      bars.forEach((b) => Object.assign(b, { y: 121.04, r: 0, sy: 1 }));
      update();
      return gsap.to(state, { p: 1, duration: 1, ease: aeOut, repeat: -1, repeatDelay: 23 * F, onUpdate: update });
    },
    "client-portal": (gsap, root) => {
      spread(many(root, '[data-l="Null 7"] [data-l]'), 104.15);
      return loop("Null 7", "x", 294.65, 398.8, 104.15 / 117.8)(gsap, root);
    },
    gantt: (gsap, root) => {
      spread(many(root, '[data-l="Null 8"] [data-l]'), 33.43);
      return loop("Null 8", "x", -29.42, 4.01, 33.43 / 95.4)(gsap, root);
    },
    "meetings-hub": (gsap, root) => {
      const a = one(root, "Shape Layer 2");
      const b = one(root, "Shape Layer 3");
      const c = one(root, "Shape Layer 4");
      const step = 17.33 * F;
      const hubA = ease("hubA", ".75,0,.83,.76");
      const hubB = ease("hubB", ".17,.13,0,1");
      const hubC = ease("hubC", ".75,0,0,1");
      const lerp = (from: number, to: number, t: number, e: gsap.EaseFunction) =>
        from + (to - from) * e(Math.min(1, Math.max(0, t)));
      const state = { t: 0 };
      const update = () => {
        const { t } = state;
        a.x = t < step ? lerp(55, 93.81, t / step, hubA) : lerp(93.81, 168.8, (t - step) / step, hubB);
        b.x = lerp(168.8, 272.54, (t - step) / step, aeOut);
        c.x = lerp(-51.73, 55, (t - step) / step, hubC);
        a.apply();
        b.apply();
        c.apply();
      };
      update();
      return gsap.to(state, {
        t: 2 * step,
        duration: 2 * step,
        ease: "none",
        repeat: -1,
        repeatDelay: 53 * F - 2 * step,
        onUpdate: update,
      });
    },
    "ai-meeting": (gsap, root) => {
      const l = one(root, "Shape Layer 2");
      const tl = gsap.timeline({ repeat: -1, repeatRefresh: true });
      tl.to(l, withApply(l, { r: "+=90", duration: 18 * F, ease: aeInOut }), 0);
      tl.to(l, withApply(l, { r: "+=90", duration: 18 * F, ease: aeInOut }), 27 * F);
      tl.set({}, {}, 53 * F);
      return tl;
    },
    "time-tracking": (gsap, root) => {
      const l = one(root, "Time tracking");
      const tl = gsap.timeline({ repeat: -1 });
      tl.set(l, withApply(l, { r: 0 }), 0);
      [7, 14, 22, 29, 37, 44].forEach((frame, i) =>
        tl.to(l, withApply(l, { r: (i + 1) * 28, duration: F, ease: "none" }), frame * F),
      );
      tl.set({}, {}, 52 * F);
      return tl;
    },
    dictation: (gsap, root) => {
      const bars = all(root, "[data-bar]");
      const peaks = [48, 88, 120, 76, 40];
      const state = { t: 0 };
      return gsap.to(state, {
        t: 1,
        duration: 53 * F,
        ease: "none",
        repeat: -1,
        onUpdate: () =>
          bars.forEach((bar, i) => {
            const n = 0.5 + 0.5 * Math.sin(2 * Math.PI * (state.t * (i % 2 ? 2 : 1) + i * 0.23));
            const h = 22 + (peaks[i] - 22) * n;
            bar.setAttribute("height", h.toFixed(2));
            bar.setAttribute("y", ((120 - h) / 2).toFixed(2));
          }),
      });
    },
    "qa-change-log": loop("Null 12", "x", 130.05, 646.19, 516.14 / 295),
    "earnings-forecast": loop("Null 11", "y", -60.36, 60, 31 * F, aeStrong, 22 * F),
    "capacity-check": loop("Null 10", "x", 0, 254.67, 52 * F),
    "retro-notes": (gsap, root) => {
      const notes = many(root, "[clip-path] [data-l]").filter((l) => {
        const hidden = +((l.el as SVGElement).dataset.i ?? 0) <= 4;
        if (hidden) (l.el as SVGElement).style.display = "none";
        return !hidden;
      });
      notes.sort((a, b) => b.x - a.x);
      const duration = 14.47 * F;
      const tl = gsap.timeline({ repeat: -1 });
      notes.forEach((n, i) => {
        const home = { x: n.x, y: 48.27 };
        const at = i * 4.83 * F;
        tl.to(n, withApply(n, { x: home.x + 142, y: home.y + 144, duration, ease: aeIn }), at);
        tl.fromTo(
          n,
          { x: home.x - 108, y: home.y - 114 },
          withApply(n, { x: home.x, y: home.y, duration, ease: aeOut, immediateRender: false }),
          at + 24 * F,
        );
      });
      tl.set({}, {}, 53 * F);
      return tl;
    },
    pipeline: (gsap, root) => {
      const corners: [Layer, number, number][] = [
        [one(root, "l top"), 0, 1],
        [one(root, "r top"), 151, 1],
        [one(root, "l bottom"), 0, 153],
        [one(root, "r bottom"), 151, 153],
      ];
      const duration = 18.9 * F;
      const tl = gsap.timeline({ repeat: -1, repeatDelay: F });
      corners.forEach(([l, x, y]) => {
        const home = { x: l.x, y: l.y };
        tl.to(l, withApply(l, { x, y, duration, ease: aeOut }), 0);
        tl.to(l, withApply(l, { ...home, duration, ease: aeOut }), 33.09 * F);
      });
      return tl;
    },
  };
}

let cache: Record<FeatureIconId, Builder> | null = null;

/** Builds the (paused) looping timeline for a feature icon, or null when it has none. */
export function createFeatureIconAnimation(gsap: GsapApi, id: FeatureIconId, svg: SVGSVGElement): Animation | null {
  cache ??= builders();
  const build = cache[id];
  return build ? build(gsap, svg).pause() : null;
}
