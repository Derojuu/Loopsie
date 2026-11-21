"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { cn } from "@/utils/cn";
import { useGsap } from "@/hooks/useGsap";
import {
  REQUEST_SOURCES,
  REQUESTS_FEED,
  REQUESTS_INITIAL,
  REQUESTS_MOTION as M,
  type ChangeRequest,
} from "@/constants/highlights";
import { prefersReducedMotion, setPos, snapshot, whileVisible, type Timeline } from "@/components/sections/highlights/motion";

function RequestRow({ request, index }: { request: ChangeRequest; index: number }) {
  const source = REQUEST_SOURCES[request.source];
  return (
    <div
      className="requests_row unit-pos flex h-82 w-555 items-center gap-40 overflow-clip rounded-15 bg-white py-5 pl-5 pr-16"
      style={{ "--x": 0, "--y": M.firstY + index * M.rowStep } as CSSProperties}
    >
      <div className={cn("requests_icon flex aspect-square shrink-0 items-center justify-center self-stretch overflow-clip rounded-10", source.color)}>
        <Image src={source.icon} alt="" width={50} height={50} unoptimized className="h-50 w-50 shrink-0" />
      </div>
      <div className="flex min-w-px flex-1 items-start justify-between gap-4 overflow-clip">
        <div className="flex min-w-px flex-1 flex-col items-start gap-4 leading-none">
          <p className="requests_quote ui-16 font-medium text-[#1c1c1a]">{request.quote}</p>
          <p className="requests_meta ui-12 text-[#999991]">
            {request.meta}
            {request.link && <span className="underline">{request.link}</span>}
          </p>
        </div>
        <div className="requests_tag flex shrink-0 items-center justify-center overflow-clip rounded-7 bg-[#d9d9d9] px-5 py-2">
          <p className="whitespace-nowrap ui-12 font-medium leading-none text-[#9c9c9c]">{request.tag}</p>
        </div>
      </div>
    </div>
  );
}

/** Card 4 — change requests dropping into a 3D list and getting tagged. */
export function Requests() {
  const root = useRef<HTMLDivElement>(null);

  useGsap(
    (gsap) => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      const restore = snapshot(el);
      const list = el.querySelector<HTMLElement>(".requests_stack")!;
      let rows = [...el.querySelectorAll<HTMLElement>(".requests_row")];
      const template = rows[0].cloneNode(true) as HTMLElement;
      let index = 0;
      let active: Timeline | null = null;

      const create = (req: ChangeRequest) => {
        const row = template.cloneNode(true) as HTMLElement;
        const { icon, color } = REQUEST_SOURCES[req.source];
        const iconBox = row.querySelector<HTMLElement>(".requests_icon")!;
        iconBox.className = iconBox.className.replace(/bg-\S+/, color);
        const img = iconBox.querySelector("img")!;
        img.removeAttribute("srcset");
        img.src = icon;
        row.querySelector(".requests_quote")!.textContent = req.quote;
        const meta = row.querySelector(".requests_meta")!;
        meta.textContent = req.meta;
        if (req.link) {
          const link = document.createElement("span");
          link.className = "underline";
          link.textContent = req.link;
          meta.append(link);
        }
        row.querySelector(".requests_tag p")!.textContent = "…";
        setPos(row, { x: 0, y: -41 });
        gsap.set(row, { autoAlpha: 0, ...M.enter });
        list.prepend(row);
        return row;
      };

      const step = () => {
        const req = REQUESTS_FEED[index++ % REQUESTS_FEED.length];
        const row = create(req);
        const tag = row.querySelector<HTMLElement>(".requests_tag")!;
        const label = tag.firstElementChild!;
        const price = /\$(\d+)/.exec(req.tag);
        const tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: step });
        tl.to(row, { "--y": M.firstY, rotationX: 0, z: 0, autoAlpha: 1, duration: 0.85 }, 0);
        rows.forEach((r, i) => {
          const leaving = i >= 2;
          tl.to(r, { "--y": M.firstY + (i + 1) * M.rowStep, ...(leaving ? M.leave : {}), duration: 0.7 }, 0);
          if (leaving) tl.to(r, { autoAlpha: 0, duration: 0.4 }, 0.1).call(() => r.remove(), undefined, 0.7);
        });
        rows = [row, ...rows.slice(0, 2)];
        tl.to(tag, { scale: 0.6, duration: 0.12, ease: "power2.in" }, 1)
          .call(() => void (label.textContent = price ? req.tag.replace(price[0], "$0") : req.tag), undefined, 1.12)
          .to(tag, { scale: 1, duration: 0.35, ease: "back.out(2.5)" }, 1.12);
        if (price) {
          const count = { value: 0 };
          tl.to(
            count,
            {
              value: Number(price[1]),
              duration: 0.6,
              ease: "power2.out",
              onUpdate: () => void (label.textContent = req.tag.replace(price[0], `$${Math.round(count.value)}`)),
            },
            1.15,
          );
        }
        tl.to({}, { duration: M.hold }, 1.5);
        active = tl;
      };

      const stop = whileVisible(el, () => (active ? active.resume() : step()), () => active?.pause());
      return () => {
        stop();
        active?.kill();
        restore();
      };
    },
    root,
  );

  return (
    <div ref={root} inert className="feature-visual requests relative h-470 w-635 shrink-0 overflow-clip rounded-20 bg-grey">
      <div className="absolute left-40 top-40 whitespace-nowrap visual-title text-black opacity-50">
        <p>Change</p>
        <p>requests</p>
      </div>
      <div className="requests_list absolute left-40 top-110 h-360 w-555 overflow-clip">
        <div className="requests_stack absolute inset-0">
          {REQUESTS_INITIAL.map((request, i) => (
            <RequestRow key={request.quote} request={request} index={i} />
          ))}
        </div>
        <div className="requests_fade pointer-events-none absolute inset-x-0 top-0 h-60" />
        <div className="requests_fade requests_fade--bottom pointer-events-none absolute inset-x-0 bottom-0 h-120" />
      </div>
    </div>
  );
}
