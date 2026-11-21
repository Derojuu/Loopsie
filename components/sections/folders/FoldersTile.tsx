"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { cn } from "@/utils/cn";
import { useGsap } from "@/hooks/useGsap";
import { MEDIA } from "@/constants/motion";
import {
  FOLDER_COLUMNS,
  FOLDER_FLIP,
  FOLDER_ITEMS,
  FOLDERS_COPY,
  FOLDERS_MOTION as M,
  type FolderAsset,
} from "@/constants/folders";

interface Item {
  el: HTMLElement;
  img: HTMLImageElement;
  label: HTMLElement | null;
  slot: number;
  asset: FolderAsset;
}

const topOf = (slot: number) => M.firstTop + M.step * slot;
const columnOf = (asset: FolderAsset | undefined) => FOLDER_COLUMNS.findIndex((c) => asset && c.assets.includes(asset));
const TOTAL_SLOTS = M.initial + M.spares;

/** Endless stack of project folders sliding upwards; folders below the pointer drop on hover. */
export function FoldersTile() {
  const root = useRef<HTMLDivElement>(null);

  useGsap(
    (gsap) => {
      const tile = root.current;
      const stack = tile?.querySelector<HTMLElement>(".folders_stack");
      if (!tile || !stack) return;
      const pristine = [...stack.childNodes].map((n) => n.cloneNode(true));
      const items: Item[] = [...stack.querySelectorAll<HTMLElement>(".folders_item")].map((el, slot) => ({
        el,
        img: el.querySelector("img")!,
        label: el.querySelector<HTMLElement>(".folders_label"),
        slot,
        asset: el.dataset.asset as FolderAsset,
      }));
      // Cycle position per column, as left by dressing the spares.
      const assetIndex = FOLDER_COLUMNS.map(() => 0);
      items.slice(M.initial).forEach((it) => assetIndex[columnOf(it.asset)]++);
      let tops: number[] = [];
      let count = 0;
      let active: gsap.core.Timeline | null = null;
      const setters = new Map<HTMLElement, (v: number) => void>();
      const setter = (el: HTMLElement) => {
        if (!setters.has(el)) setters.set(el, gsap.quickTo(el, "--hover", { duration: 0.6, ease: "power3.out" }));
        return setters.get(el)!;
      };

      const refresh = () => {
        items.sort((a, b) => a.slot - b.slot);
        tops = items.map((it) => topOf(it.slot));
      };

      const dress = (it: Item, prev: FolderAsset | undefined) => {
        const col = columnOf(prev);
        const r = col < 0 ? it.slot % FOLDER_COLUMNS.length : (col + 1) % FOLDER_COLUMNS.length;
        const column = FOLDER_COLUMNS[r];
        const asset = column.assets[assetIndex[r]++ % column.assets.length];
        it.asset = asset;
        it.el.dataset.asset = asset;
        it.img.src = `/folders/${asset}.svg`;
        it.img.classList.toggle("-scale-x-100", FOLDER_FLIP[asset]);
        if (!it.label) {
          it.label = document.createElement("span");
          it.label.className = "folders_label absolute top-21 font-hand";
          it.label.textContent = FOLDERS_COPY.label;
          it.el.append(it.label);
        }
        it.label.style.setProperty("--x", String(column.x));
        it.el.style.setProperty("--top", String(topOf(it.slot)));
      };

      const recycle = (by: number) => {
        items.forEach((it) => (it.slot -= by));
        const out = items.filter((it) => it.slot < 0).sort((a, b) => a.slot - b.slot);
        const free: number[] = [];
        for (let s = 0; s < TOTAL_SLOTS; s++) if (!items.some((it) => it.slot === s)) free.push(s);
        out.forEach((it, k) => {
          it.slot = free[k];
          dress(it, items.find((o) => o.slot === it.slot - 1)?.asset);
        });
        items.sort((a, b) => a.slot - b.slot).forEach((it) => stack.append(it.el));
        refresh();
      };

      const slide = (by: number, duration: number, stagger: number) => {
        const tl = gsap.timeline({
          onComplete: () => {
            recycle(by);
            step();
          },
        });
        [...items].reverse().forEach((it, i) => {
          tl.to(it.el, { "--top": topOf(it.slot - by), duration, ease: "power3.inOut" }, i * stagger);
        });
        tl.to({}, { duration: M.hold });
        active = tl;
      };

      const step = () => {
        count++;
        if (count % 3 === 0) slide(M.bigSlide, 1.5, 0.02);
        else slide(gsap.utils.random([2, 3]), 1.1, 0.025);
      };

      refresh();

      const cleanups: (() => void)[] = [];
      if (window.matchMedia(MEDIA.finePointer).matches) {
        const onMove = (e: MouseEvent) => {
          const box = tile.getBoundingClientRect();
          const scale = box.width / 910;
          const y = e.clientY - box.top;
          let over = 0;
          tops.forEach((top, i) => {
            if (top * scale <= y) over = i;
          });
          items.forEach((it, i) => setter(it.el)(i > over ? M.hoverDrop : 0));
        };
        const onLeave = () => items.forEach((it) => setter(it.el)(0));
        tile.addEventListener("mousemove", onMove);
        tile.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          tile.removeEventListener("mousemove", onMove);
          tile.removeEventListener("mouseleave", onLeave);
        });
      }

      if (!window.matchMedia(MEDIA.reducedMotion).matches) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) return void active?.pause();
            if (active) active.resume();
            else step();
          },
          { rootMargin: "10%" },
        );
        observer.observe(tile);
        cleanups.push(() => observer.disconnect());
      }

      return () => {
        cleanups.forEach((fn) => fn());
        active?.kill();
        stack.replaceChildren(...pristine);
      };
    },
    root,
  );

  return (
    <div
      ref={root}
      className="folders_tile relative aspect-[910/812] w-910 shrink-0 overflow-clip rounded-20 bg-white l:w-full l:rounded-30 s:rounded-15"
      aria-hidden="true"
    >
      <div className="folders_stack absolute inset-0">
        {FOLDER_ITEMS.map((item, slot) => (
          <div
            key={slot}
            className="folders_item absolute left-0 h-338 w-910"
            style={{ "--top": topOf(slot), "--hover": 0 } as CSSProperties}
            data-asset={item.asset}
          >
            <Image
              src={`/folders/${item.asset}.svg`}
              alt=""
              width={910}
              height={338}
              unoptimized
              className={cn("h-full w-full", FOLDER_FLIP[item.asset] && "-scale-x-100")}
            />
            {item.labelX !== undefined && (
              <span className="folders_label absolute top-21 font-hand" style={{ "--x": item.labelX } as CSSProperties}>
                {FOLDERS_COPY.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
