"use client";

import Image from "next/image";
import { useRef } from "react";
import { cn } from "@/utils/cn";
import { useGsap } from "@/hooks/useGsap";
import {
  GAUGE_ARC,
  INCOME_GOAL,
  INCOME_KEYS,
  INCOME_LIMITS,
  INCOME_SEGMENTS,
  type IncomeKey,
} from "@/constants/highlights";
import { prefersReducedMotion, whileVisible } from "@/components/sections/highlights/motion";

type Values = Record<IncomeKey, number>;

const KEYS = INCOME_SEGMENTS.map((s) => s.key);
const BASE = Object.fromEntries(INCOME_SEGMENTS.map((s) => [s.key, s.value])) as Values;
const LIMITS = {
  income: INCOME_LIMITS.income.map((f) => f * INCOME_GOAL) as [number, number],
  step: INCOME_LIMITS.step.map((f) => f * INCOME_GOAL) as [number, number],
  inconv: INCOME_LIMITS.inconv.map((f) => f * INCOME_GOAL) as [number, number],
  segmentMin: INCOME_LIMITS.segmentMin * INCOME_GOAL,
  gapMin: INCOME_LIMITS.gapMin * INCOME_GOAL,
};

const money = (v: number) => `$${(v / 1000).toFixed(2)}k`;
const incomeOf = (v: Values) => INCOME_KEYS.reduce((sum, k) => sum + v[k], 0);
const totalOf = (v: Values) => KEYS.reduce((sum, k) => sum + v[k], 0);
const needleAngle = (income: number) => -180 * (1 - income / INCOME_GOAL);
const offsets = (v: Values) => {
  let acc = 0;
  return KEYS.map((k) => {
    const o = acc;
    acc += v[k];
    return o;
  });
};

/** Card 1 — semicircle gauge of the month's income against the goal. */
export function IncomeGauge() {
  const root = useRef<HTMLDivElement>(null);

  useGsap(
    (gsap) => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      const q = <T extends Element>(s: string) => el.querySelector<T>(s)!;
      const segs = KEYS.map((k) => q<SVGPathElement>(`.income-gauge_seg[data-key="${k}"]`));
      const labels = Object.fromEntries(
        [...el.querySelectorAll<HTMLElement>(".income-gauge_value")].map((n) => [n.dataset.key ?? "", n]),
      );
      const needle = q<SVGLineElement>(".income-gauge_needle");
      const counter = q<HTMLElement>(".income-gauge_counter");
      const percent = q<HTMLElement>(".income-gauge_percent");
      const chips = [...el.querySelectorAll<HTMLElement>(".income-gauge_chip")];
      const values: Values = { ...BASE };
      let active: gsap.core.Animation | null = null;

      const render = (v: Values) => {
        let acc = 0;
        segs.forEach((seg, i) => {
          seg.setAttribute("stroke-dasharray", `${v[KEYS[i]]} ${INCOME_GOAL}`);
          seg.setAttribute("stroke-dashoffset", String(-acc));
          acc += v[KEYS[i]];
        });
        const income = incomeOf(v);
        needle.setAttribute("transform", `rotate(${needleAngle(income)} 237.5 237.5)`);
        counter.textContent = Math.round(income).toLocaleString("en-US");
        percent.textContent = `${Math.round((income / INCOME_GOAL) * 100)}%`;
        KEYS.forEach((k) => (labels[k].textContent = money(v[k])));
        labels.gap.textContent = money(Math.min(INCOME_GOAL - totalOf(v), INCOME_GOAL - 10));
      };
      const lightChips = (lit: (k: IncomeKey) => boolean) =>
        chips.forEach((chip, i) => chip.style.setProperty("opacity", lit(KEYS[i]) ? "1" : "0.35"));

      const nextIncome = (current: number, jump: boolean) => {
        const [lo, hi] = LIMITS.income;
        const [min, max] = LIMITS.step;
        for (let i = 0; i < 20; i++) {
          const next = jump ? gsap.utils.random(lo, hi) : current + (Math.random() < 0.5 ? -1 : 1) * gsap.utils.random(min, max);
          if (next >= lo && next <= hi && Math.abs(next - current) >= min) return next;
        }
        return current >= (lo + hi) / 2 ? current - min : current + min;
      };
      const distribute = (income: number): Values => {
        const weights = INCOME_KEYS.map((k) => BASE[k] * gsap.utils.random(0.8, 1.2));
        const sum = weights.reduce((a, b) => a + b, 0);
        const out = {} as Values;
        INCOME_KEYS.forEach((k, i) => (out[k] = Math.max(LIMITS.segmentMin, (weights[i] / sum) * income)));
        const cap = Math.min(LIMITS.inconv[1], INCOME_GOAL - LIMITS.gapMin - income);
        out.inconv = gsap.utils.clamp(LIMITS.inconv[0], cap, BASE.inconv * gsap.utils.random(0.7, 1.3));
        KEYS.forEach((k) => (out[k] = Math.round(out[k] / 10) * 10));
        return out;
      };

      const wait = (s: number) => {
        active = gsap.delayedCall(s, drift);
      };
      const drift = () => {
        const jump = Math.random() < 0.35;
        const target = distribute(nextIncome(incomeOf(values), jump));
        active = gsap.to(values, {
          ...target,
          duration: jump ? gsap.utils.random(1.6, 2.4) : gsap.utils.random(0.8, 1.3),
          ease: jump ? "power2.inOut" : "sine.inOut",
          onUpdate: () => render(values),
          onComplete: () => wait(gsap.utils.random(0.5, 1.8)),
        });
      };
      const start = () => {
        if (active) return void active.resume();
        const fill = { value: 0 };
        active = gsap.to(fill, {
          value: totalOf(BASE),
          duration: 2.6,
          ease: "power2.inOut",
          onUpdate: () => {
            let acc = 0;
            const v = {} as Values;
            KEYS.forEach((k) => {
              v[k] = gsap.utils.clamp(0, BASE[k], fill.value - acc);
              acc += BASE[k];
            });
            render(v);
            lightChips((k) => v[k] === BASE[k]);
          },
          onComplete: () => wait(1.6),
        });
      };

      render(Object.fromEntries(KEYS.map((k) => [k, 0])) as Values);
      lightChips(() => false);
      const stop = whileVisible(el, start, () => active?.pause());
      return () => {
        stop();
        active?.kill();
        render(BASE);
        lightChips(() => true);
      };
    },
    root,
  );

  const offs = offsets(BASE);
  const income = incomeOf(BASE);

  return (
    <div
      ref={root}
      inert
      className="feature-visual income-gauge relative h-470 w-635 shrink-0 overflow-clip rounded-20 bg-grey"
      data-goal={INCOME_GOAL}
    >
      <p className="absolute left-40 top-40 w-170 visual-title text-black opacity-50">Month income</p>
      <div className="absolute left-80 top-125 h-237 w-475 overflow-clip">
        <svg viewBox="0 0 475 475" fill="none" overflow="visible" className="absolute left-0 top-0 h-475 w-475" aria-hidden="true">
          <path d={GAUGE_ARC} className="stroke-[#e2e2e2]" strokeWidth="59.375" />
          {INCOME_SEGMENTS.map((seg, i) => (
            <path
              key={seg.key}
              d={GAUGE_ARC}
              className={cn("income-gauge_seg", seg.stroke)}
              strokeWidth="59.375"
              pathLength={INCOME_GOAL}
              strokeDasharray={`${seg.value} ${INCOME_GOAL}`}
              strokeDashoffset={-offs[i]}
              data-key={seg.key}
              data-value={seg.value}
            />
          ))}
          <line
            className="income-gauge_needle"
            x1="237.5"
            y1="237.5"
            x2="515.5"
            y2="237.5"
            stroke="#b4b4b4"
            strokeDasharray="2 2"
            transform={`rotate(${needleAngle(income)} 237.5 237.5)`}
          />
        </svg>
        <div className="absolute left-163 top-120 h-75 w-149 bg-grey">
          <div className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-end bg-grey">
            <div className="relative flex items-center justify-center gap-10 text-center leading-none text-[#1c1c1a]">
              <p className="income-gauge_counter ui-52 font-bold tabular-nums">{income.toLocaleString("en-US")}</p>
              <p className="absolute -left-10 top-17 -translate-x-1/2 ui-32 font-bold">$</p>
            </div>
            <div className="flex items-center justify-center rounded-5 bg-[#e4e4e4] px-4 py-2">
              <p className="whitespace-nowrap text-right ui-10 leading-1 text-[#6b6b66]">
                <span className="income-gauge_percent font-bold tabular-nums">{Math.round((income / INCOME_GOAL) * 100)}%</span> of{" "}
                <span className="font-bold">${INCOME_GOAL.toLocaleString("en-US")}</span> goal
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute left-40 top-383 flex w-555 flex-wrap items-start justify-between gap-y-8 overflow-clip rounded-10 bg-white p-15">
        {INCOME_SEGMENTS.map((seg) => (
          <div key={seg.key} className="flex shrink-0 items-center gap-6 overflow-clip income-gauge_chip transition-opacity duration-300">
            <div className={cn("size-11 shrink-0 rounded-3", seg.chip)} />
            <p className="whitespace-nowrap text-center ui-13 leading-1 text-[#6b6b66]">
              {seg.label}{" "}
              <span className="income-gauge_value tabular-nums" data-key={seg.key}>
                {money(seg.value)}
              </span>
            </p>
          </div>
        ))}
        <div className="flex shrink-0 items-center gap-6 overflow-clip">
          <div className="size-11 shrink-0 rounded-3 bg-[#e2e2e2] border-1 border-[#e3e0d9]" />
          <p className="whitespace-nowrap text-center ui-13 leading-1 text-[#6b6b66]">
            Gap{" "}
            <span className="income-gauge_value tabular-nums" data-key="gap">
              {money(INCOME_GOAL - totalOf(BASE))}
            </span>
          </p>
        </div>
      </div>
      <Image src="/highlights/line-dash-h.svg" alt="" width={555} height={1} unoptimized className="absolute left-40 top-362 h-1 w-555" />
      <div className="absolute left-1/2 top-359 size-6 -translate-x-1/2 rounded-full bg-[#b4b4b4]" />
    </div>
  );
}
