"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { cn } from "@/utils/cn";
import { useGsap } from "@/hooks/useGsap";
import {
  CHAPTER_COLUMNS,
  CHAPTERS_MOTION as M,
  CHAPTERS_START,
  PRIORITY_COLORS,
  PRIORITY_OPTIONS,
  type Priority,
} from "@/constants/highlights";
import { Cursor } from "@/components/sections/highlights/Cursor";
import {
  moveTo,
  prefersReducedMotion,
  setPos,
  snapshot,
  tap,
  whileVisible,
  type Point,
  type Timeline,
} from "@/components/sections/highlights/motion";

const TAG = "ui-8 leading-1.1 text-[rgba(0,0,0,0.4)]";

function CardBody({ tag, tagClass }: { tag: string; tagClass: string }) {
  return (
    <div className="flex w-full flex-col items-start gap-20">
      <div className="h-5 w-full bg-[#d9d9d9]" />
      <div className={cn("flex items-center justify-center rounded-7 px-4 py-2", tagClass)}>
        <p className={cn("whitespace-nowrap", TAG)}>{tag}</p>
      </div>
    </div>
  );
}

/** Card 2 — shared kanban board where you and the client move work along. */
export function Chapters() {
  const root = useRef<HTMLDivElement>(null);

  useGsap(
    (gsap) => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      const restore = snapshot(el);
      const q = (s: string) => el.querySelector<HTMLElement>(s)!;
      const columns = [...el.querySelectorAll<HTMLElement>(".chapters_column")];
      const card = q(".chapters_drag");
      const cardTag = q(".chapters_drag-tag");
      const comment = q(".chapters_comment");
      const you = q(".chapters_you");
      const client = q(".chapters_client");
      const tag = q(".chapters_tag");
      const dropdown = q(".chapters_dropdown");
      const options = [...el.querySelectorAll<HTMLElement>(".chapters_option")];
      const priorities = options.map((o) => o.textContent!.trim() as Priority);
      let cycle = 0;

      gsap.set(client.firstElementChild, { transformOrigin: "0% 0%" });
      gsap.set(you.firstElementChild, { transformOrigin: "50% 0%" });
      gsap.set(comment, { scale: 0, autoAlpha: 0 });
      gsap.set(card, M.lift);

      // Measure the board in unit space (635 units wide).
      const box = el.getBoundingClientRect();
      const unit = box.width / 635;
      const rect = (n: Element) => {
        const r = n.getBoundingClientRect();
        return { x: (r.left - box.left) / unit, y: (r.top - box.top) / unit, w: r.width / unit, h: r.height / unit };
      };
      const slot = (col: number, index: number): Point => {
        const cards = [...columns[col].querySelectorAll(".chapters_card")].map(rect);
        const stride = cards[1] ? cards[1].y - cards[0].y : cards[0].h + 5;
        return { x: cards[0].x, y: cards[0].y + stride * index };
      };
      const plus = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });

      const backlog = slot(0, 2);
      const progress = slot(1, 1);
      const approval = slot(2, 2);
      const done = slot(3, 1);
      const tagBox = rect(tag);
      const optionBoxes = options.map(rect);
      const tagCorner = { x: tagBox.x + tagBox.w - 5, y: tagBox.y + tagBox.h };
      const nextPriority = () => priorities[(cycle + 1) % priorities.length];
      const nextOption = () => {
        const o = optionBoxes[(cycle + 1) % optionBoxes.length];
        return { x: o.x + 10, y: o.y + o.h / 2 - 2 };
      };

      setPos(card, progress);
      setPos(you, plus(progress, M.youGrip));
      setPos(client, tagCorner);

      const setTag = (node: HTMLElement, name: Priority) => {
        node.firstElementChild!.textContent = name;
        gsap.to(node, { backgroundColor: PRIORITY_COLORS[name], duration: 0.25 });
      };
      const reset = (at: Point) => {
        setPos(card, at);
        cardTag.firstElementChild!.textContent = "Urgent";
        gsap.set(cardTag, { backgroundColor: PRIORITY_COLORS.Urgent, scale: 1 });
        gsap.set(comment, { scale: 0, autoAlpha: 0 });
        gsap.set(card, { scale: 0.9 });
      };
      const drag = (
        tl: Timeline,
        at: number,
        target: Point,
        col: number,
        cursor: HTMLElement,
        grip: Point,
        opts: { duration: number; arc: number } = M.drag,
      ) => {
        tl.to(card, { ...M.lift, duration: 0.25, ease: "power2.out" }, at)
          .to(columns[col], { backgroundColor: M.column.target, duration: 0.3 }, at + 0.2)
          .add(moveTo(gsap, card, target, opts), at + 0.2)
          .add(moveTo(gsap, cursor, plus(target, grip), opts), at + 0.2)
          .to(card, { ...M.drop, duration: 0.3, ease: "power2.out" }, at + 0.2 + opts.duration)
          .to(columns[col], { backgroundColor: M.column.idle, duration: 0.4 }, at + 0.2 + opts.duration);
      };

      const loop = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.8,
        defaults: { ease: "power2.inOut" },
        onRepeat: () => void cycle++,
      });
      loop
        .add(moveTo(gsap, client, nextOption, { duration: 0.7, arc: 6 }), 0.2)
        .add(tap(gsap, client), 1)
        .call(() => setTag(tag, nextPriority()), undefined, 1.08)
        .to(dropdown, { autoAlpha: 0, duration: 0.25 }, 1.2)
        .add(moveTo(gsap, you, plus(approval, M.youGrip), { duration: 1, arc: 12 }), 0.4)
        .add(moveTo(gsap, client, plus(approval, M.clientGrip), { duration: 1.2, arc: 16 }), 1.5)
        .add(tap(gsap, client), 2.8)
        .to(comment, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(2)" }, 2.9);
      drag(loop, 3.5, done, 3, client, M.clientGrip);
      loop
        .call(() => setTag(cardTag, "Approved"), undefined, 5.1)
        .to(cardTag, { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" }, 5.1)
        .to(card, { autoAlpha: 0, duration: 0.35 }, 5.9)
        .add(moveTo(gsap, client, tagCorner, { duration: 1.4, arc: 18 }), 5.8)
        .add(moveTo(gsap, you, plus(backlog, M.youGrip), { duration: 1, arc: 12 }), 5.5)
        .call(() => reset(backlog), undefined, 6.3)
        .to(card, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 6.4);
      drag(loop, 7, progress, 1, you, M.youGrip, { duration: 1.1, arc: 20 });
      loop.add(tap(gsap, client), 7.6).to(dropdown, { autoAlpha: 1, duration: 0.25 }, 7.7);
      drag(loop, 8.9, approval, 2, you, M.youGrip);

      const tl = gsap
        .timeline({ paused: true })
        .add(moveTo(gsap, card, approval, { duration: 1.1, arc: 12 }), 0)
        .add(moveTo(gsap, you, plus(approval, M.youGrip), { duration: 1.1, arc: 12 }), 0)
        .to(card, { ...M.drop, duration: 0.3, ease: "power2.out" }, 1.1)
        .add(loop, 1.5);

      const stop = whileVisible(el, () => tl.play(), () => tl.pause());
      return () => {
        stop();
        tl.kill();
        restore();
      };
    },
    root,
  );

  return (
    <div ref={root} inert className="feature-visual chapters relative h-470 w-635 shrink-0 overflow-clip rounded-20 bg-grey">
      <p className="absolute left-40 top-40 whitespace-nowrap visual-title text-black opacity-50">Chapters</p>
      <div className="absolute left-40 top-111 flex h-319 w-555 items-start gap-5">
        {CHAPTER_COLUMNS.map((column) => (
          <div
            key={column.label}
            className="chapters_column flex h-full min-w-px flex-1 flex-col items-start gap-20 rounded-15 border-0.5 border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)] p-5"
          >
            <div className={cn("flex w-full flex-col items-start justify-center rounded-10 p-15", column.bg)}>
              <p className="whitespace-nowrap ui-12 font-medium leading-none text-[#1c1c1a]">{column.label}</p>
            </div>
            <div className="flex w-full flex-col items-start gap-5">
              {column.cards.map((c, i) => (
                <div key={i} className="chapters_card relative flex w-full flex-col justify-center rounded-10 bg-white p-15">
                  <CardBody tag={c.tag} tagClass={cn(c.tagBg, c.editable && "chapters_tag")} />
                  {c.editable && (
                    <div className="chapters_dropdown absolute left-15 top-56 flex w-56 flex-col items-start gap-3 rounded-3 border-0.5 border-[rgba(0,0,0,0.3)] bg-white p-5 shadow-[0_4px_7px_rgba(0,0,0,0.1)]">
                      {PRIORITY_OPTIONS.map((option) => (
                        <p key={option} className={cn("chapters_option whitespace-nowrap", TAG)}>
                          {option}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        className="unit-pos chapters_drag flex w-125 flex-col items-start justify-center rounded-10 border-1 border-[#ff6e6e] bg-white p-15 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
        style={{ "--x": CHAPTERS_START.card.x, "--y": CHAPTERS_START.card.y } as CSSProperties}
      >
        <CardBody tag="Urgent" tagClass="chapters_drag-tag bg-[rgba(255,110,110,0.5)]" />
        <div className="chapters_comment absolute bottom-15 right-15 flex items-center gap-3 rounded-7 bg-[#f0f0f0] px-4 py-2 opacity-0">
          <Image src="/highlights/icon-message.svg" alt="" width={8} height={8} unoptimized className="h-8 w-8" />
          <p className={cn("whitespace-nowrap", TAG)}>1</p>
        </div>
      </div>
      <Cursor kind="arrow" label="Client" at={CHAPTERS_START.client} className="chapters_client" />
      <Cursor kind="hand" label="You" at={CHAPTERS_START.you} className="chapters_you" />
    </div>
  );
}
