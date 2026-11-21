"use client";

import { useEffect, useRef, useState } from "react";
import { registerGsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { LINKS } from "@/constants/site";
import { MEDIA } from "@/constants/motion";

const STORAGE_KEY = "loopsii-cookies";

function isAccepted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Bottom-left cookie notice. Slides up once after mount unless it was already
 * dismissed (persisted in localStorage), and slides away on "OK".
 */
export function CookieBanner() {
  const card = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Storage is client-only: decide after hydration so SSR markup stays stable.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isAccepted()) setVisible(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!visible || !card.current) return;
    const gsap = registerGsap();
    const reduce = window.matchMedia(MEDIA.reducedMotion).matches;
    const el = card.current;

    if (dismissed) {
      gsap.killTweensOf(el);
      const tween = gsap.to(el, {
        yPercent: 120,
        autoAlpha: 0,
        duration: reduce ? 0 : 0.6,
        ease: "power3.in",
        onComplete: () => setVisible(false),
      });
      return () => {
        tween.kill();
      };
    }

    const tween = gsap.fromTo(
      el,
      { yPercent: 120, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: reduce ? 0 : 1, ease: "power4", delay: 0.4 },
    );
    return () => {
      tween.kill();
    };
  }, [visible, dismissed]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage unavailable (private mode / blocked): just hide for this visit.
    }
    setDismissed(true);
  };

  if (!visible) return null;

  return (
    <div
      className="cookies pointer-events-none fixed bottom-30 left-30 z-9 w-[calc(100vw-var(--spacing)*60)] max-w-460 l:bottom-20 l:left-20 l:w-[calc(100vw-var(--spacing)*40)]"
      role="region"
      aria-label="Cookie notice"
    >
      <div
        ref={card}
        className="cookies_card pointer-events-auto invisible flex items-center gap-20 rounded-20 bg-white py-15 pr-15 pl-25 shadow-[0_4px_45px_rgba(0,0,0,0.08)] s:pl-20"
      >
        <p className="cookies_text flex-1">
          We use cookies to keep the site working and to see how it’s used.{" "}
          <a href={LINKS.privacy} data-track="cookies-privacy" className="go underline underline-offset-2">
            Privacy Policy
          </a>
        </p>
        <button
          type="button"
          data-track="cookies-ok"
          className="cookies_ok flex h-44 shrink-0 cursor-pointer items-center rounded-full border border-black px-24 s:h-36 s:px-18"
          onClick={dismiss}
        >
          OK
        </button>
      </div>
    </div>
  );
}
