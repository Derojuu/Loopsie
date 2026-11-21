"use client";

import type { GsapApi } from "@/components/sections/highlights/motion";
import { DICTATE_MOTION as M, DICTATE_SCENES } from "@/constants/highlights";

/** One spoken token: `raw` is what was heard, `clean` what ends up written. */
export interface Token {
  raw: string | null;
  clean: string | null;
  brk: "gap" | "line" | null;
  at?: number;
  gone?: number;
  show?: number;
  move?: number;
  span?: number;
  far?: number;
  a?: [number, number];
  b?: [number, number];
  el?: HTMLSpanElement;
  text?: string;
}

interface Tick {
  at: number;
  levels: number[];
}

export interface Scene {
  app: string;
  label: string;
  color: string;
  tokens: Token[];
  end: number;
  morph: number;
  hide: number;
  out: number;
  ticks: Tick[];
  start: number;
  dur: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const inQuad = (v: number) => clamp01(v) ** 2;
const inCubic = (v: number) => clamp01(v) ** 3;
const outCubic = (v: number) => 1 - (1 - clamp01(v)) ** 3;
const inOutCubic = (v: number) => (clamp01(v) < 0.5 ? 4 * clamp01(v) ** 3 : 1 - (-2 * clamp01(v) + 2) ** 3 / 2);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const outBack = (v: number, s = 1.4) => {
  const n = 1 - clamp01(v);
  return 1 - n * n * ((s + 1) * n - s);
};

/** Parses the `said` grammar documented on `DICTATE_SCENES`. */
export function parseSaid(said: string): Token[] {
  const tokens: Token[] = [];
  let brk: Token["brk"] = null;
  for (const part of said.split(" ")) {
    if (part === "/" || part === "//") {
      brk = part === "/" ? "gap" : "line";
      continue;
    }
    const [raw, clean = raw] = part.startsWith("+") ? [null, part.slice(1)] : part.split("|");
    const token: Token = { raw, clean: clean || null, brk: null };
    if (token.clean) {
      token.brk = brk;
      brk = null;
    }
    tokens.push(token);
  }
  return tokens;
}

/** Split clean text into paragraphs (used for the static, pre-JS rendering). */
export function cleanParagraphs(said: string): { gap: boolean; text: string }[] {
  const out: { gap: boolean; text: string }[] = [];
  for (const t of parseSaid(said)) {
    if (!t.clean) continue;
    if (!out.length || t.brk) out.push({ gap: t.brk === "gap", text: t.clean });
    else out[out.length - 1].text += ` ${t.clean}`;
  }
  return out;
}

function meterTicks(gsap: GsapApi, spoken: Token[], end: number, hide: number): Tick[] {
  const ticks: Tick[] = [];
  let levels = [0, 0, 0, 0, 0];
  let loud = 0;
  let beat = 0;
  let next = 0;
  for (let at = 0.28; at <= hide + 1e-9; at += M.tick) {
    while (next < spoken.length && spoken[next].at! - 0.06 <= at) {
      loud = gsap.utils.random(0.65, 1);
      next++;
    }
    let level: number;
    if (at >= end) level = M.finishing[beat++ % M.finishing.length];
    else {
      level = Math.max(loud * gsap.utils.random(0.6, 1), levels[4] * 0.6);
      loud *= 0.7;
    }
    levels = [...levels.slice(1), level < 0.01 ? 0 : level];
    ticks.push({ at, levels });
  }
  return ticks;
}

function buildScenes(gsap: GsapApi): { scenes: Scene[]; duration: number } {
  let start = 0;
  const scenes = DICTATE_SCENES.map((s) => {
    const tokens = parseSaid(s.said);
    const spoken = tokens.filter((t) => t.raw !== null);
    spoken.forEach((t, i) => (t.at = 0.55 + i * M.wordStep));
    const end = 0.55 + spoken.length * M.wordStep + 0.3;
    const morph = end + 0.5;
    const hide = end + 0.65;
    let dropped = 0;
    for (const t of tokens) if (t.raw !== null && !t.clean) t.gone = morph + 0.03 * dropped++;
    const out = morph + 1.5 + M.hold;
    const scene: Scene = {
      app: s.app,
      label: s.label,
      color: s.color,
      tokens,
      end,
      morph,
      hide,
      out,
      ticks: meterTicks(gsap, spoken, end, hide),
      start,
      dur: out + 0.4,
    };
    start += scene.dur;
    return scene;
  });
  return { scenes, duration: start };
}

/**
 * "Apps" dictation loop: raw speech appears word by word, fillers fade out and
 * the remaining words glide into a cleanly formatted message.
 */
export class DictateScenes {
  private frame: HTMLElement;
  private area: HTMLElement;
  private head: { dot: HTMLElement; app: HTMLElement; label: HTMLElement };
  private pill: HTMLElement;
  private bars: HTMLElement[];
  private scenes: Scene[];
  private duration: number;
  private state = { t: M.startAt };
  private shown = -1;
  private playing = false;
  private active: gsap.core.Tween | null = null;

  constructor(
    private gsap: GsapApi,
    root: HTMLElement,
  ) {
    const q = (s: string) => root.querySelector<HTMLElement>(s)!;
    this.frame = q(".dictate_frame");
    this.area = q(".dictate_area");
    this.head = { dot: q(".dictate_app-dot"), app: q(".dictate_app"), label: q(".dictate_label") };
    this.pill = q(".dictate_pill");
    this.bars = [...root.querySelectorAll<HTMLElement>(".dictate_bar")];
    ({ scenes: this.scenes, duration: this.duration } = buildScenes(gsap));
    this.area.replaceChildren();
    this.bars.forEach((b) => (b.style.transform = `scaleY(${3 / 16})`));
  }

  play(): void {
    this.playing = true;
    if (this.active) this.active.resume();
    else document.fonts.ready.then(() => this.playing && !this.active && this.begin());
  }

  pause(): void {
    this.playing = false;
    this.active?.pause();
  }

  destroy(): void {
    this.playing = false;
    this.active?.kill();
  }

  private begin() {
    this.measure();
    this.active = this.gsap.fromTo(
      this.state,
      { t: 0 },
      {
        t: this.duration,
        duration: this.duration,
        ease: "none",
        repeat: -1,
        paused: !this.playing,
        onUpdate: () => this.render(this.state.t),
      },
    );
    this.active.time(M.startAt, true);
    this.render(M.startAt);
  }

  private word(text: string) {
    const span = document.createElement("span");
    span.className = "dictate_word";
    span.textContent = text;
    return span;
  }

  /** Lays every scene out twice (raw speech / clean text) to record each word's two positions in em. */
  private measure() {
    const probe = document.createElement("div");
    probe.className = "dictate_measure";
    this.area.append(probe);
    const style = getComputedStyle(this.area);
    const size = parseFloat(style.fontSize);
    const line = parseFloat(style.lineHeight) / size;

    for (const scene of this.scenes) {
      const said = document.createElement("p");
      const written = document.createElement("div");
      probe.replaceChildren(said, written);
      const placed: ["a" | "b", Token, HTMLElement, HTMLElement][] = [];
      for (const t of scene.tokens) {
        if (t.raw === null) continue;
        if (said.childNodes.length) said.append(" ");
        placed.push(["a", t, said, said.appendChild(this.word(t.raw))]);
      }
      let para: HTMLElement | null = null;
      for (const t of scene.tokens) {
        if (!t.clean) continue;
        if (!para || t.brk) {
          para = written.appendChild(document.createElement("p"));
          if (t.brk === "gap") para.className = "dictate_gap";
        } else para.append(" ");
        placed.push(["b", t, written, para.appendChild(this.word(t.clean))]);
      }
      for (const [key, t, box, w] of placed) {
        t[key] = [(w.offsetLeft - box.offsetLeft) / size, (w.offsetTop - box.offsetTop) / size];
      }
      const rows = [...new Set(scene.tokens.filter((t) => t.clean).map((t) => t.b![1]))].sort((x, y) => x - y);
      let order = 0;
      for (const t of scene.tokens) {
        if (!t.clean) continue;
        const settle = scene.morph + 0.8 + 0.1 * rows.indexOf(t.b![1]);
        if (t.raw === null) t.show = settle - 0.1;
        else {
          t.move = scene.morph + 0.25 + 0.01 * order++;
          t.span = settle - t.move;
          t.far = Math.min(1, Math.hypot(t.b![0] - t.a![0], t.b![1] - t.a![1]) / line);
        }
      }
    }
    probe.remove();
  }

  private fill(scene: Scene) {
    this.head.dot.className = this.head.dot.className.replace(/bg-\w+/, scene.color);
    this.head.app.textContent = scene.app;
    this.head.label.textContent = scene.label;
    for (const t of scene.tokens) {
      t.el = this.word((t.raw ?? t.clean)!);
      t.text = t.el.textContent!;
    }
    this.area.replaceChildren(...scene.tokens.map((t) => t.el!));
  }

  private place(t: Token, x: number, y: number, opacity: number, blur: number, alpha: number, text: string) {
    const el = t.el!;
    if (text !== t.text) {
      el.textContent = text;
      t.text = text;
    }
    el.style.transform = `translate(${x.toFixed(4)}em, ${y.toFixed(4)}em)`;
    el.style.opacity = String(opacity);
    el.style.filter = blur > 0.001 ? `blur(${blur.toFixed(4)}em)` : "none";
    el.style.color = `rgba(${M.ink}, ${alpha.toFixed(3)})`;
  }

  private levels(scene: Scene, time: number) {
    let i = -1;
    while (i + 1 < scene.ticks.length && scene.ticks[i + 1].at <= time) i++;
    const zero = [0, 0, 0, 0, 0];
    if (i < 0) return zero;
    const prev = i ? scene.ticks[i - 1].levels : zero;
    const k = clamp01((time - scene.ticks[i].at) / M.tick);
    return scene.ticks[i].levels.map((v, j) => prev[j] + (v - prev[j]) * k);
  }

  private render(total: number) {
    const t = ((total % this.duration) + this.duration) % this.duration;
    const index = this.scenes.findIndex((s) => t < s.start + s.dur);
    const scene = this.scenes[index];
    const local = t - scene.start;
    if (index !== this.shown) {
      this.fill(scene);
      this.shown = index;
    }

    const enter = outCubic(local / 0.5);
    const leave = inQuad((local - scene.out) / 0.4);
    const frameBlur = 6 * (1 - enter + leave);
    this.frame.style.opacity = String(enter * (1 - leave));
    this.frame.style.filter = frameBlur > 0.01 ? `blur(${frameBlur.toFixed(3)}px)` : "none";
    this.frame.style.transform = `scale(${0.98 + 0.02 * enter - 0.02 * leave})`;

    for (const tk of scene.tokens) {
      if (tk.raw === null) {
        const p = outCubic((local - tk.show!) / 0.35);
        this.place(tk, tk.b![0], tk.b![1], p, 0.15 * (1 - p), 1, tk.clean!);
        continue;
      }
      const appear = outCubic((local - tk.at!) / 0.5);
      if (!tk.clean) {
        const g = inQuad((local - tk.gone!) / 0.3);
        this.place(tk, tk.a![0], tk.a![1], appear * (1 - g), 0.15 * (1 - appear) + 0.15 * g, 0.4, tk.raw);
        continue;
      }
      const m = inOutCubic((local - tk.move!) / tk.span!);
      const swaps = tk.clean !== tk.raw;
      const lift = smoothstep(0, 0.2, m) * (1 - smoothstep(0.88, 1, m)) * Math.max(tk.far!, swaps ? 0.7 : 0);
      this.place(
        tk,
        tk.a![0] + (tk.b![0] - tk.a![0]) * m,
        tk.a![1] + (tk.b![1] - tk.a![1]) * m,
        appear * (1 - 0.75 * lift),
        0.15 * (1 - appear) + 0.14 * lift,
        0.4 + 0.6 * m,
        swaps && m >= 0.5 ? tk.clean : tk.raw,
      );
    }

    let scale: number, opacity: number, y: number, blur: number;
    if (local < scene.hide) {
      const e = outBack(local / 0.5);
      scale = 0.6 + 0.4 * e;
      opacity = Math.min(1, e);
      y = 6 * (1 - e);
      blur = Math.max(0, 6 * (1 - e));
    } else {
      const e = inCubic((local - scene.hide) / 0.3);
      scale = 1 - 0.1 * e;
      opacity = 1 - e;
      y = 0;
      blur = 4 * e;
    }
    this.pill.style.opacity = String(opacity);
    this.pill.style.filter = blur > 0.01 ? `blur(${blur.toFixed(3)}px)` : "none";
    this.pill.style.transform = `translateY(${y.toFixed(3)}px) scale(${scale.toFixed(4)})`;

    const lv = this.levels(scene, local);
    this.bars.forEach((b, i) => (b.style.transform = `scaleY(${((3 + 11 * lv[i]) / 16).toFixed(4)})`));
  }
}
