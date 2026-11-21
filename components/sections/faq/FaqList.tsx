"use client";

import { useEffect, useRef } from "react";
import { FAQ_INITIAL_OPEN, FAQ_ITEMS } from "@/constants/faq";
import { getNavRoom, useAccordion } from "@/hooks/useAccordion";
import { useLenis } from "@/components/providers/SmoothScroll";
import { registerGsap, ScrollTrigger } from "@/lib/gsap";
import { FaqItem } from "@/components/sections/faq/FaqItem";

/** Single-open FAQ list (port of the original `faq` home module). */
export function FaqList() {
  const listRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  const { openIndex, toggle } = useAccordion(FAQ_INITIAL_OPEN, {
    // Keep the opening question in view when a taller answer above collapses.
    onBeforeOpen: (index, previous) => {
      const items = listRef.current?.querySelectorAll<HTMLElement>(".faq_item");
      const item = items?.[index];
      if (!items || !item) return;
      const shift =
        previous !== null && previous < index
          ? (items[previous].querySelector<HTMLElement>(".faq_body")?.offsetHeight ?? 0)
          : 0;
      const room = getNavRoom();
      const top = item.getBoundingClientRect().top - shift;
      if (top < room) lenis?.scrollTo(window.scrollY + top - room, { duration: 0.6 });
    },
  });

  // Reserve the height of the tallest answer so the page below never jumps.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const reserve = () => {
      const previous = list.style.minHeight;
      list.style.minHeight = "";
      const items = [...list.querySelectorAll<HTMLElement>(".faq_item")];
      const openHeight = items
        .filter((item) => item.classList.contains("is-open"))
        .reduce((sum, item) => sum + (item.querySelector<HTMLElement>(".faq_body")?.offsetHeight ?? 0), 0);
      const tallest = Math.max(...items.map((item) => item.querySelector<HTMLElement>(".faq_answer")?.offsetHeight ?? 0));
      list.style.minHeight = `${list.offsetHeight - openHeight + tallest}px`;
      if (list.style.minHeight !== previous) {
        registerGsap();
        ScrollTrigger.refresh();
      }
    };

    let cancelled = false;
    reserve();
    document.fonts?.ready.then(() => !cancelled && reserve());
    window.addEventListener("resize", reserve);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", reserve);
    };
  }, []);

  return (
    <div ref={listRef} className="faq_list flex flex-col">
      {FAQ_ITEMS.map((item, i) => (
        <FaqItem key={item.id} item={item} open={openIndex === i} onToggle={() => toggle(i)} />
      ))}
    </div>
  );
}
