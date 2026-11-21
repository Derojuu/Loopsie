"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { cn } from "@/utils/cn";
import { useGsap } from "@/hooks/useGsap";
import { MONTHS, TIMELINE as T, TIMELINE_BARS, TIMELINE_MONTHS } from "@/constants/highlights";
import { Cursor } from "@/components/sections/highlights/Cursor";
import {
  moveTo,
  prefersReducedMotion,
  setPos,
  snapshot,
  tap,
  whileVisible,
  type GsapApi,
  type Timeline as Tl,
} from "@/components/sections/highlights/motion";

interface Bar {
  el: HTMLElement;
  x: number;
  w: number;
  lane: number;
  check: HTMLElement;
  done: boolean;
}
interface Month {
  el: HTMLElement;
  x: number;
  label: HTMLElement;
  line: HTMLElement;
  weight: number;
}

const HALF = T.monthWidth / 2;
const DAY = T.monthWidth / 30;
const unitVars = (vars: Record<string, number>) =>
  Object.fromEntries(Object.entries(vars).map(([k, v]) => [`--${k}`, v])) as CSSProperties;

function timelineLoop(gsap: GsapApi, el: HTMLElement) {
  const q = (s: string) => el.querySelector<HTMLElement>(s)!;
  const world = q(".timeline_world");
  const hatch = q(".timeline_hatch");
  const free = q(".timeline_free");
  const startLabel = q(".timeline_start");
  const you = q(".timeline_you");
  const template = q(".timeline_bar").cloneNode(true) as HTMLElement;
  let bars: Bar[] = [...el.querySelectorAll<HTMLElement>(".timeline_bar")].map((b) => ({
    el: b,
    x: Number(b.dataset.x),
    w: Number(b.dataset.w),
    lane: Number(b.dataset.lane),
    check: b.querySelector<HTMLElement>(".timeline_check")!,
    done: false,
  }));
  const months: Month[] = [...el.querySelectorAll<HTMLElement>(".timeline_month")].map((m) => ({
    el: m,
    x: Number(m.dataset.x),
    label: m.querySelector("p")!,
    line: m.querySelector<HTMLElement>(".timeline_month-line")!,
    weight: 0,
  }));
  let lastMonth = MONTHS.indexOf(months[months.length - 1].label.textContent!.trim() as (typeof MONTHS)[number]);
  const today = new Date(T.startDate[0], T.startDate[1], T.startDate[2]);
  const view = { shift: 0 };
  const stats = { hours: T.freeHours };
  let counter = 4;
  let spawned = 0;
  let active: Tl | null = null;

  gsap.set(you.firstElementChild, { transformOrigin: "50% 0%" });
  months.forEach((m) => {
    const tone = m.label.classList.contains("font-semibold") ? T.weights.active : T.weights.muted;
    m.label.classList.remove("font-semibold");
    m.weight = tone.weight;
    m.label.style.fontVariationSettings = `'wght' ${m.weight}`;
    gsap.set(m.label, { color: tone.color });
  });
  gsap.set(bars.map((b) => b.check), { scale: 0 });

  const laneEnd = (lane: number) =>
    bars
      .filter((b) => b.lane === lane)
      .reduce((end, b) => Math.max(end, b.done ? Math.min(b.x + b.w, T.today) : b.x + b.w), -Infinity);
  const freeLanes = () => T.lanes.map((_, i) => i).filter((i) => laneEnd(i) <= 361);
  const canStartX = () => Math.min(...T.lanes.map((_, i) => Math.max(T.today, laneEnd(i))));
  const dateAt = (x: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + Math.round((x - T.today) / DAY));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const stat = (tl: Tl, at: number) => {
    const hours = 15 + 22.5 * freeLanes().length;
    const startX = canStartX();
    const date = dateAt(startX);
    const hatchX = T.origin.x + startX + 2;
    tl.to(stats, { hours, duration: 0.5, onUpdate: () => void (free.textContent = String(Math.round(stats.hours))) }, at)
      .call(() => void (startLabel.textContent = date), undefined, at)
      .to(hatch, { "--x": hatchX, "--w": T.hatchEnd - hatchX, duration: 0.5 }, at);
  };

  const spawn = (lane: number): Bar => {
    const node = template.cloneNode(true) as HTMLElement;
    const w = T.widths[(spawned * 2 + lane) % T.widths.length];
    const x = Math.max(363, laneEnd(lane) + 8) + gsap.utils.random(0, 36);
    const name = T.names[spawned % T.names.length];
    const color = T.colors[spawned % T.colors.length];
    spawned++;
    node.className = node.className.replace(/bg-\S+/, color);
    node.querySelector("p")!.textContent = `${name} · ${String(counter++).padStart(3, "0")}`;
    node.style.setProperty("--w", String(w));
    setPos(node, { x, y: T.lanes[lane] - 14 });
    gsap.set(node, { autoAlpha: 0, opacity: 0, scale: 0.94, transformOrigin: "0% 50%" });
    const check = node.querySelector<HTMLElement>(".timeline_check")!;
    gsap.set(check, { scale: 0, autoAlpha: 0 });
    world.insertBefore(node, months[0].el);
    const bar = { el: node, x, w, lane, check, done: false };
    bars.push(bar);
    return bar;
  };

  const nearest = (offset: number) =>
    months.reduce((best, m) =>
      Math.abs(m.x - offset - T.today) < Math.abs(best.x - offset - T.today) ? m : best,
    );

  const emphasize = (m: Month, { weight, color }: { weight: number; color: string }, duration: number) => {
    const lineAlpha = weight === T.weights.active.weight ? 0 : 1;
    return gsap
      .timeline()
      .to(
        m,
        {
          weight,
          duration,
          ease: "power2.inOut",
          onUpdate: () => void (m.label.style.fontVariationSettings = `'wght' ${Math.round(m.weight)}`),
        },
        0,
      )
      .to(m.label, { color, duration, ease: "power2.inOut" }, 0)
      .to(m.line, { autoAlpha: lineAlpha, duration, ease: "power2.inOut" }, 0);
  };

  const normalize = () => {
    view.shift = 0;
    world.style.setProperty("--shift", "0");
    today.setDate(today.getDate() + T.stepDays);
    bars = bars.filter((b) => {
      b.x -= HALF;
      if (b.x + b.w < -T.origin.x - 10) {
        b.el.remove();
        return false;
      }
      setPos(b.el, { x: b.x, y: T.lanes[b.lane] });
      return true;
    });
    months.forEach((m) => {
      m.x -= HALF;
      if (m.x < -T.monthWidth / 2) {
        m.x += T.monthWidth * months.length;
        lastMonth = (lastMonth + 1) % MONTHS.length;
        m.label.textContent = MONTHS[lastMonth];
      }
      setPos(m.el, { x: m.x, y: 82 });
    });
  };

  const step = () => {
    const tl = gsap.timeline({ onComplete: step });
    let at = 0;
    const finished = bars.filter((b) => !b.done && b.x + b.w <= 369);
    finished.forEach((b) => {
      const target = {
        x: T.origin.x + b.x + b.w + T.youGrip.x,
        y: T.origin.y + T.lanes[b.lane] + T.youGrip.y,
      };
      tl.add(moveTo(gsap, you, target, { duration: 0.8, arc: 10 }), at);
      at += 0.85;
      tl.add(tap(gsap, you), at)
        .call(() => void (b.done = true), undefined, at + 0.1)
        .to(b.el, { opacity: 0.55, duration: 0.4 }, at + 0.1)
        .to(b.check, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(2)" }, at + 0.15);
      at += 0.7;
    });
    if (finished.length) {
      tl.add(moveTo(gsap, you, T.youRest, { duration: 0.7, arc: 8 }), at);
      stat(tl, at);
      at += 0.6;
    }

    const open = freeLanes();
    let picked = open.filter(() => Math.random() < T.spawnChance);
    if (open.length && !picked.length) picked = [gsap.utils.random(open)];
    const fresh = picked.map(spawn);
    fresh.forEach((b) => {
      tl.to(b.el, { "--y": T.lanes[b.lane], scale: 1, autoAlpha: 1, duration: 0.55, ease: "back.out(1.4)" }, at);
      at += 0.35;
    });
    if (fresh.length) {
      stat(tl, at + 0.3);
      at += 0.6;
    }
    at += 0.9;

    const current = nearest(0);
    const next = nearest(HALF);
    if (next !== current) {
      tl.add(emphasize(current, T.weights.muted, 1.3), at);
      tl.add(emphasize(next, T.weights.active, 1.3), at);
    }
    tl.to(
      view,
      {
        shift: HALF,
        duration: 1.3,
        ease: "power2.inOut",
        onUpdate: () => world.style.setProperty("--shift", String(view.shift)),
      },
      at,
    );
    tl.call(normalize, undefined, at + 1.3);
    active = tl;
  };

  const play = () => {
    if (active) return void active.resume();
    gsap.to(you, { autoAlpha: 1, duration: 0.4 });
    step();
  };

  const stop = whileVisible(el, play, () => active?.pause());
  return () => {
    stop();
    active?.kill();
  };
}

/** Card 3 — project timeline scrolling past "today" with free capacity. */
export function Timeline() {
  const root = useRef<HTMLDivElement>(null);

  useGsap(
    (gsap) => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      const restore = snapshot(el);
      const stop = timelineLoop(gsap, el);
      return () => {
        stop();
        restore();
      };
    },
    root,
  );

  return (
    <div ref={root} inert className="feature-visual timeline relative h-470 w-635 shrink-0 overflow-clip rounded-20 bg-grey">
      <div className="absolute left-40 top-40 whitespace-nowrap visual-title text-black opacity-50">
        <p>Projects</p>
        <p>timeline</p>
      </div>
      <div className="timeline_hatch unit-pos unit-w h-200 overflow-clip" style={unitVars(T.hatch)}>
        <Image src="/highlights/hatch.svg" alt="" width={184} height={200} unoptimized className="absolute right-0 top-0 h-200 w-184 max-w-none" />
      </div>
      <div className="absolute left-420 top-67 flex w-72 flex-col items-start gap-5 ui-12 leading-none">
        <p className="w-full font-medium text-[#1c1c1a]">Free</p>
        <p className="w-full whitespace-nowrap text-black">
          ≈ <span className="timeline_free tabular-nums">{T.freeHours}</span> hrs / mo
        </p>
      </div>
      <p className="absolute left-420 top-111 whitespace-nowrap ui-12 font-medium leading-none text-[#1c1c1a]">
        Can start <span className="timeline_start">{T.canStart}</span>
      </p>
      <div className="timeline_world absolute left-40 top-40 h-390 w-555" style={{ "--shift": 0 } as CSSProperties}>
        {TIMELINE_BARS.map((bar) => (
          <div
            key={bar.label}
            className={cn("timeline_bar unit-pos unit-w flex h-56 items-center overflow-clip rounded-full px-24", bar.bg)}
            style={unitVars({ x: bar.x, y: T.lanes[bar.lane], w: bar.w })}
            data-x={bar.x}
            data-w={bar.w}
            data-lane={bar.lane}
          >
            <p className="whitespace-nowrap ui-16 font-medium leading-none text-[#1c1c1a]">{bar.label}</p>
            <span className="timeline_check absolute right-16 top-20 flex size-16 items-center justify-center rounded-full bg-[rgba(0,0,0,0.12)] ui-10 leading-none text-[#1c1c1a] opacity-0">
              ✓
            </span>
          </div>
        ))}
        {TIMELINE_MONTHS.map((month) => {
          const isActive = "active" in month && month.active;
          return (
            <div
              key={month.label}
              className="timeline_month unit-pos flex -translate-x-1/2 flex-col items-center"
              style={unitVars({ x: month.x, y: 82 })}
              data-x={month.x}
            >
              <div className={cn("timeline_month-line flex h-281 w-0 items-center justify-center", isActive && "opacity-0")}>
                <Image src="/highlights/line-dash-v.svg" alt="" width={281} height={1} unoptimized className="h-1 w-281 max-w-none shrink-0 rotate-90" />
              </div>
              <p
                className={cn(
                  "mt-7 whitespace-nowrap ui-15 leading-1",
                  isActive ? "font-semibold text-[#1c1c1a]" : "text-[#6b6b66]",
                )}
              >
                {month.label}
              </p>
            </div>
          );
        })}
      </div>
      <div className="absolute left-397 top-40 flex h-363 w-0 items-center justify-center">
        <Image src="/highlights/line-today.svg" alt="" width={363} height={2} unoptimized className="h-2 w-363 max-w-none shrink-0 rotate-90" />
      </div>
      <div className="absolute left-394 top-40 size-8 bg-black s:size-6" />
      <Image src="/highlights/line-dash-h.svg" alt="" width={555} height={1} unoptimized className="absolute left-40 top-403 h-1 w-555" />
      <Cursor kind="hand" label="You" at={T.youRest} className="timeline_you opacity-0" />
    </div>
  );
}
