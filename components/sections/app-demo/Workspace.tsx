"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { registerGsap } from "@/lib/gsap";
import { MEDIA } from "@/constants/motion";
import { ADM_NAV, ADM_TILT_FALLBACK } from "@/constants/app-demo";
import { Sidebar } from "@/components/sections/app-demo/Sidebar";
import { Topbar } from "@/components/sections/app-demo/Topbar";
import { HomeRoom } from "@/components/sections/app-demo/HomeRoom";
import { AskFab } from "@/components/sections/app-demo/AskFab";
import { NoticeCard } from "@/components/sections/app-demo/NoticeCard";
import { Toasts } from "@/components/sections/app-demo/Toasts";
import { ScrollFade } from "@/components/sections/app-demo/ScrollFade";
import { WorkspaceProvider } from "@/components/sections/app-demo/workspace-context";

const PLATES = ["sky", "lime", "coral", "sage", "apricot"] as const;

/** Sidebar controls animated in, in order (matches the original `data-track` list). */
const SIDEBAR_ENTER = ["logo", "search", ...ADM_NAV.map((n) => n.key), "collapse", "account"]
  .map((k) => `[data-track="demo-sidebar-${k}"]`)
  .join(", ");

type CardState = "hidden" | "shown" | "gone";

/**
 * The interactive, pinned 3D mock of the Loopsii web app: plates, frame and canvas
 * with the Home room, plus the entrance timeline, pointer tilt and notification card.
 */
export function Workspace() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(true);
  const [inView, setInView] = useState(false);
  const [card, setCard] = useState<CardState>("hidden");
  const cardRef = useRef<CardState>("hidden");
  const enteredRef = useRef(false);
  const inViewRef = useRef(false);

  const updateCard = useCallback((next: CardState) => {
    cardRef.current = next;
    setCard(next);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const gsap = registerGsap();
    const ctx = gsap.context(() => {}, root);
    const reduced = matchMedia(MEDIA.reducedMotion).matches;
    const phone = matchMedia(MEDIA.phone);
    let wellInView = false;
    let isArmed = true;
    let enter: gsap.core.Timeline | null = null;

    /** Shows the notification once the demo has entered and is mostly on screen. */
    const maybeShowCard = () => {
      if (enteredRef.current && !phone.matches && wellInView && cardRef.current === "hidden") updateCard("shown");
    };

    const onEntered = () => {
      enter = null;
      if (enteredRef.current) return;
      enteredRef.current = true;
      maybeShowCard();
    };

    const buildEnter = () =>
      ctx.add(() => {
        const q = (sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];
        const canvas = root.querySelector<HTMLElement>(".adm-canvas");
        const tl = gsap.timeline();
        const add = (els: HTMLElement[], from: gsap.TweenVars, to: gsap.TweenVars, at: number) => {
          if (els.length) tl.fromTo(els, from, { clearProps: "opacity,visibility,transform", ...to }, at);
        };
        if (canvas) canvas.style.pointerEvents = "none";
        add(q(".adm-plate"), { autoAlpha: 0, scale: 0.92, y: 24 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.06 }, 0);
        add(q(".adm-frame"), { autoAlpha: 0, y: 32, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out" }, 0.05);
        add(q(SIDEBAR_ENTER), { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: "power2.out", stagger: 0.035 }, 0.3);
        add(q('[data-adm-enter="bar"]'), { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.06 }, 0.35);
        add(q('[data-adm-enter="word"]'), { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "power4.out", stagger: 0.04 }, 0.4);
        add(
          q('[data-adm-enter="card"]').sort((a, b) => a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 },
          0.45,
        );
        add(q('[data-adm-enter="recording"]'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.06 }, 0.6);
        add(q('[data-adm-enter="day"]').slice(0, 60), { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(1.7)", stagger: 0.006 }, 0.7);
        tl.call(
          () => {
            canvas?.style.removeProperty("pointer-events");
            onEntered();
          },
          undefined,
          Math.max(0, tl.duration() - 0.6),
        );
        enter = tl;
      });

    const play = () => {
      enter?.kill();
      enter = null;
      if (!reduced && !phone.matches) buildEnter();
      isArmed = false;
      setArmed(false);
      if (!enter) onEntered();
    };

    if (!reduced && !phone.matches) {
      const rect = root.getBoundingClientRect();
      isArmed = rect.bottom <= 0 || rect.top >= innerHeight;
    } else {
      isArmed = false;
    }
    setArmed(isArmed);
    if (!isArmed) onEntered();

    const io = new IntersectionObserver(
      ([entry]) => {
        wellInView = entry.intersectionRatio >= 0.6;
        inViewRef.current = entry.intersectionRatio >= 0.25;
        setInView(inViewRef.current);
        if (isArmed && entry.isIntersecting) play();
        maybeShowCard();
      },
      { threshold: [0, 0.25, 0.6, 1] },
    );
    io.observe(root);
    window.addEventListener("scroll", maybeShowCard, { passive: true });

    // Pointer tilt of the whole demo (desktop, fine pointer only).
    const zoom = root.querySelector<HTMLElement>(".adm-zoom");
    const canvas = root.querySelector<HTMLElement>(".adm-canvas");
    let untilt = () => {};
    if (zoom && canvas && !reduced && matchMedia(MEDIA.finePointer).matches) {
      const rotX = gsap.quickTo(zoom, "rotationX", { duration: 1.2, ease: "power3.out" });
      const rotY = gsap.quickTo(zoom, "rotationY", { duration: 1.2, ease: "power3.out" });
      let tilt = 0;
      let overCanvas = false;
      let focused = false;
      const readTilt = () => (tilt = parseFloat(getComputedStyle(root).getPropertyValue("--adm-tilt")) || ADM_TILT_FALLBACK);
      const reset = () => {
        rotX(0);
        rotY(0);
      };
      const onMove = (e: MouseEvent) => {
        if (overCanvas || focused || e.buttons || !enteredRef.current || !inViewRef.current || phone.matches) return;
        if (canvas.querySelector('[role="dialog"]')) return reset();
        const r = root.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
        const y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
        rotX(y * -tilt);
        rotY(x * tilt);
      };
      const onEnter = () => {
        overCanvas = true;
        reset();
      };
      const onLeave = () => (overCanvas = false);
      const onFocusIn = (e: FocusEvent) => {
        if ((e.target as Element).matches?.(":focus-visible")) {
          focused = true;
          reset();
        }
      };
      const onFocusOut = (e: FocusEvent) => {
        if (!canvas.contains(e.relatedTarget as Node)) focused = false;
      };
      readTilt();
      canvas.addEventListener("pointerenter", onEnter);
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("focusin", onFocusIn);
      canvas.addEventListener("focusout", onFocusOut);
      window.addEventListener("mousemove", onMove, { passive: true });
      untilt = () => {
        canvas.removeEventListener("pointerenter", onEnter);
        canvas.removeEventListener("pointerleave", onLeave);
        canvas.removeEventListener("focusin", onFocusIn);
        canvas.removeEventListener("focusout", onFocusOut);
        window.removeEventListener("mousemove", onMove);
        gsap.killTweensOf(zoom);
        gsap.set(zoom, { clearProps: "transform" });
      };
    }

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", maybeShowCard);
      untilt();
      ctx.revert();
    };
  }, [updateCard]);

  const cardShown = card === "shown" && inView;

  return (
    <WorkspaceProvider>
      <div
        ref={rootRef}
        role="region"
        aria-label="Sample Loopsii workspace"
        data-track="demo"
        data-nosnippet=""
        className={cn("adm", armed && "is-armed", !inView && "is-offscreen")}
      >
        <div className="adm-zoom">
          <div className="adm-plates" aria-hidden="true">
            {PLATES.map((p) => (
              <span key={p} className={`adm-plate adm-plate--${p}`} />
            ))}
          </div>
          <div className="adm-frame">
            <div className="adm-canvas">
              <div className="app:flex app:h-full app:overflow-hidden app:bg-surface-tertiary">
                <Sidebar />
                <div className="app:flex app:min-w-0 app:flex-1 app:flex-col app:overflow-hidden app:py-8 app:pr-8 app:pl-8 app:md:pl-0">
                  <div
                    className="app-card app:flex app:min-h-0 app:flex-1 app:flex-col app:overflow-hidden app:rounded-2xl app:border app:border-hairline"
                    data-route="home"
                  >
                    <Topbar />
                    <div className="app:relative app:flex app:min-h-0 app:flex-1">
                      <ScrollFade paint="var(--app-surface)" className="app-main">
                        <div className="app-room">
                          <HomeRoom />
                        </div>
                      </ScrollFade>
                    </div>
                  </div>
                </div>
              </div>
              <AskFab />
              <Toasts />
              <div className="tour" aria-live="polite" />
            </div>
          </div>
          <NoticeCard shown={cardShown} onDismiss={() => updateCard("gone")} onReview={() => updateCard("gone")} />
        </div>
      </div>
    </WorkspaceProvider>
  );
}
