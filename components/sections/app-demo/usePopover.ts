"use client";

import { useEffect, useRef, useState } from "react";

/** Open/close state for a demo popover that closes on outside pointerdown or Escape. */
export function usePopover<T extends HTMLElement, P extends HTMLElement>() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<T>(null);
  const panelRef = useRef<P>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return { open, setOpen, triggerRef, panelRef };
}

/** Row style shared by the demo's menus and listboxes. */
export const ADM_MENU_ROW =
  "app:relative app:flex app:h-32 app:w-full app:shrink-0 app:items-center app:gap-8 app:rounded-lg app:px-8 app:text-left app:text-note app:transition-colors app:focus-visible:outline-none app:motion-reduce:transition-none app:cursor-pointer app:text-label-primary app:hover:bg-hover app:focus-visible:bg-hover";
