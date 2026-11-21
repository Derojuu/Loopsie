"use client";

import type { RefObject } from "react";
import type { AnimationItem } from "lottie-web";
import { useGsap } from "@/hooks/useGsap";
import { ScrollTrigger, SplitText } from "@/lib/gsap";
import { STACK_MOTION as M } from "@/constants/stack";

type Node = HTMLElement & { bx?: number; by?: number };

/** Loads a lottie (light SVG player) into `container`, parked on `frame`. */
function loadLottie(container: HTMLElement, path: string, frame: number | null) {
  return import("lottie-web/build/player/lottie_light").then(
    ({ default: lottie }) =>
      new Promise<AnimationItem | null>((resolve) => {
        const anim = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: false,
          autoplay: false,
          path,
          rendererSettings: { progressiveLoad: false },
        });
        anim.addEventListener("DOMLoaded", () => {
          if (frame !== null) anim.goToAndStop(frame, true);
          resolve(anim);
        });
        anim.addEventListener("data_failed", () => resolve(null));
      }),
  );
}

/** Port of the original `stack` module: grid lines, cards, links, rotation, loop and offer. */
export function useStackMotion(scope: RefObject<HTMLElement | null>) {
  useGsap(
    (gsap) => {
      const instance = scope.current;
      if (!instance) return;
      const cells = instance.querySelector<HTMLElement>(".stack_cells")!;
      const cards = [...instance.querySelectorAll<HTMLElement>(".stack_app[data-app]")];
      const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
      const hover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const wide = window.matchMedia("(min-width: 480px)");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let destroyed = false;
      const cleanups: (() => void)[] = [];

      // ---- links (hover arrows + notes) --------------------------------
      let active: string | null = null;
      const linkEls: Element[] = [];
      const linksTl = gsap.timeline({ paused: true, onReverseComplete: () => gsap.set(linkEls, { autoAlpha: 0 }) });
      instance.querySelectorAll<SVGGElement>(".stack_link").forEach((link, i) => {
        const note = instance.querySelector(`.stack_link-note[data-link="${link.dataset.link}"]`)!;
        const [curve, head] = link.querySelectorAll("path");
        const at = i * M.linkStagger;
        linkEls.push(link, note);
        linksTl.fromTo(curve, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.6, ease: "power2.inOut" }, at);
        linksTl.fromTo(head, { autoAlpha: 0, drawSVG: "0%" }, { autoAlpha: 1, drawSVG: "100%", duration: 0.2, ease: "power1.out" }, at + 0.6);
        linksTl.fromTo(note, { clipPath: M.clipHidden }, { clipPath: M.clipShown, duration: 0.55, ease: "power2.inOut" }, at + 0.2);
      });

      let hideCall: gsap.core.Tween | undefined;
      const cardsState: { tl?: gsap.core.Timeline; ready: number } = { ready: 0 };
      const cardsShown = () => !cardsState.tl || cardsState.tl.time() >= cardsState.ready;

      const show = (id: string) => {
        hideCall?.kill();
        if (!wide.matches) return;
        cards.forEach((c) => c.classList.toggle("is-active", c.dataset.app === id));
        const was = !!active;
        active = id;
        if (!was) {
          gsap.set(linkEls, { autoAlpha: 1 });
          linksTl.timeScale(1).play();
        }
      };
      const hide = () => {
        if (!active) return;
        active = null;
        linksTl.timeScale(2.5).reverse();
        cards.forEach((c) => c.classList.remove("is-active"));
      };
      const onEnter = (e: Event) => show((e.currentTarget as HTMLElement).dataset.app!);
      const onLeave = () => {
        hideCall?.kill();
        hideCall = gsap.delayedCall(0.12, hide);
      };
      const onTap = (e: Event) => (active ? hide() : show((e.currentTarget as HTMLElement).dataset.app!));
      for (const card of cards) {
        if (hover) {
          card.addEventListener("mouseenter", onEnter);
          card.addEventListener("mouseleave", onLeave);
        } else card.addEventListener("click", onTap);
      }
      cleanups.push(() => {
        hideCall?.kill();
        for (const card of cards) {
          card.removeEventListener("mouseenter", onEnter);
          card.removeEventListener("mouseleave", onLeave);
          card.removeEventListener("click", onTap);
        }
      });

      // ---- lottie mark --------------------------------------------------
      const markEl = instance.querySelector<HTMLElement>(".stack_mark");
      const markReady = markEl ? loadLottie(markEl, "/lotties/logo.json", reduce ? 20 : 0) : Promise.resolve(null);
      cleanups.push(() => void markReady.then((a) => a?.destroy()));

      if (reduce) {
        gsap.set(instance.querySelectorAll("[data-plus]"), { autoAlpha: 1 });
        return () => {
          destroyed = true;
          cleanups.forEach((fn) => fn());
        };
      }

      // ---- head ---------------------------------------------------------
      const title = instance.querySelector<HTMLElement>(".stack_title")!;
      const note = instance.querySelector<HTMLElement>(".stack_note")!;
      let split: SplitText | undefined;
      let headTl: gsap.core.Timeline | undefined;
      let headScroll: ScrollTrigger | undefined;
      const initHead = () => {
        split = new SplitText(title, { type: "lines, words" });
        gsap.set(split.lines, { overflow: "hidden", paddingBottom: "0.1em", marginBottom: "-0.1em" });
        headTl = gsap
          .timeline({ paused: true })
          .fromTo(note, { clipPath: M.clipHidden }, { clipPath: M.clipShown, duration: 0.7, ease: "power2.inOut" }, 0)
          .fromTo(split.words, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: "power4", stagger: 0.04 }, 0.2);
        const tl = headTl;
        headScroll = ScrollTrigger.create({ trigger: title, start: "top 85%", once: true, onEnter: () => void tl.play() });
      };
      const killHead = () => {
        headScroll?.kill();
        headTl?.kill();
        split?.revert();
      };
      initHead();
      cleanups.push(killHead);

      // ---- grid lines ---------------------------------------------------
      let linesTl: gsap.core.Timeline | null = null;
      let linesScroll: ScrollTrigger | null = null;
      const killLines = () => {
        linesScroll?.kill();
        linesTl?.kill();
        linesScroll = linesTl = null;
      };
      const initLines = () => {
        killLines();
        if (touch) return;
        const width = cells.offsetWidth;
        const cell = width / (parseFloat(getComputedStyle(cells).getPropertyValue("--cols")) || 8);
        const mid = width / 2;
        const lines = [...instance.querySelectorAll<HTMLElement>(".stack_vline, .stack_tail, .stack_hline")].filter(
          (el) => el.offsetParent,
        );
        if (!lines.length) return;
        const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
        lines.forEach((el) => {
          if (el.classList.contains("stack_hline")) tl.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: cell }, el.offsetTop);
          else
            tl.fromTo(
              el,
              { scaleY: 0 },
              { scaleY: 1, duration: el.offsetHeight },
              el.offsetTop + (Math.abs(el.offsetLeft - mid) / mid) * cell,
            );
        });
        linesTl = tl;
        linesScroll = ScrollTrigger.create({ trigger: cells, start: "top 90%", end: `+=${tl.duration()}`, scrub: true, animation: tl });
      };
      initLines();
      cleanups.push(killLines);

      // ---- cards + counters ---------------------------------------------
      const stats = instance.querySelectorAll(".stack_stat");
      const syncText = instance.querySelector(".stack_sync-text");
      const dots = instance.querySelectorAll(".stack_dot");
      const pluses = instance.querySelectorAll("[data-plus]");
      const totalEl = instance.querySelector<HTMLElement>("[data-total]")!;
      const loginsEl = instance.querySelector<HTMLElement>("[data-logins]")!;
      const loginsLabel = instance.querySelector<HTMLElement>("[data-logins-label]")!;
      const live = cards.map((c) => ({ value: "upNext" in c.dataset ? 0 : Number(c.dataset.price) }));
      const count = { cards: 0 };
      const shown: { total: number | null; logins: number | null } = { total: null, logins: null };

      const renderCount = () => {
        const t = count.cards;
        const total = Math.round(live.reduce((sum, item, i) => sum + item.value * gsap.utils.clamp(0, 1, t - i), 0));
        const logins = Math.round(t);
        if (total !== shown.total) {
          totalEl.textContent = total.toLocaleString("en-US");
          shown.total = total;
        }
        if (logins !== shown.logins) {
          loginsEl.textContent = String(logins);
          loginsLabel.textContent = logins === 1 ? "login" : "logins";
          shown.logins = logins;
        }
        if (active && !cardsShown()) hide();
      };

      const ctl = gsap.timeline({ paused: true, onUpdate: renderCount });
      ctl.fromTo(stats, { autoAlpha: 0, yPercent: 25 }, { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: "power2.out" }, 0);
      cards.forEach((card, i) => {
        const at = 0.15 + i * 0.35;
        ctl.fromTo(
          card,
          { autoAlpha: 0, scale: 0.55, rotate: i % 2 ? 6 : -6 },
          { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.6, ease: "back.out(1.6)" },
          at,
        );
        ctl.fromTo(count, { cards: i }, { cards: i + 1, duration: 0.3, ease: "power1.out", immediateRender: false }, at + 0.15);
      });
      cardsState.ready = ctl.duration();
      ctl.fromTo(syncText, { autoAlpha: 0, yPercent: 25 }, { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: "power2.out" }, ">-0.2");
      ctl.fromTo(dots, { scale: 0 }, { scale: 1, duration: 0.3, stagger: 0.08, ease: "back.out(2)" }, "<0.1");
      ctl.fromTo(pluses, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, cardsState.ready);
      cardsState.tl = ctl;
      ScrollTrigger.create(
        touch
          ? { trigger: cells, start: "top 75%", onEnter: () => void ctl.play() }
          : { trigger: cells, start: "top 85%", end: "top 25%", scrub: true, animation: ctl },
      );

      // ---- brand rotation -----------------------------------------------
      const pools = cards.map((c) => JSON.parse(c.dataset.brands ?? "[]") as [string, number][]);
      const brandIndex = cards.map(() => 0);
      let rotateAt = 0;
      let rotating = false;
      let rotateCall: gsap.core.Tween | undefined;

      const swapText = (el: Element | null, text: string) => {
        const current = el?.firstElementChild as HTMLElement | null;
        if (!el || !current || el.children.length > 1) return;
        const next = current.cloneNode() as HTMLElement;
        next.textContent = text;
        el.append(next);
        gsap.set(next, { position: "absolute", left: 0, top: 0, yPercent: 110 });
        gsap
          .timeline({
            onComplete: () => {
              // Keep the React-owned node: copy the text back and drop the clone.
              current.textContent = text;
              gsap.set(current, { clearProps: "transform,opacity,visibility" });
              next.remove();
            },
          })
          .to(current, { yPercent: -110, autoAlpha: 0, duration: 0.25, ease: "power2.in" }, 0)
          .to(next, { yPercent: 0, duration: 0.4, ease: "power3.out" }, 0.08);
      };

      const scheduleRotate = (delay: number) => {
        rotateCall?.kill();
        if (rotating && !destroyed) rotateCall = gsap.delayedCall(delay, rotate);
      };
      const rotate = () => {
        if (!cardsShown()) return scheduleRotate(0.6);
        let i = rotateAt % cards.length;
        if (cards[i].dataset.app === active) i = (i + 1) % cards.length;
        rotateAt = i + 1;
        const pool = pools[i];
        const idx = (brandIndex[i] + 1) % pool.length;
        const [name, price] = pool[idx];
        const card = cards[i];
        brandIndex[i] = idx;
        swapText(card.querySelector(".stack_app-name"), name);
        swapText(card.querySelector(".stack_app-price"), `$${price.toLocaleString("en-US")}/yr`);
        gsap.to(live[i], {
          value: "upNext" in card.dataset ? 0 : price,
          duration: 0.45,
          ease: "power2.inOut",
          onUpdate: renderCount,
        });
        scheduleRotate(M.rotateEvery);
      };
      const rotateObserver = new IntersectionObserver(
        ([entry]) => {
          rotating = entry.isIntersecting;
          if (rotating) scheduleRotate(M.rotateEvery);
          else rotateCall?.kill();
        },
        { rootMargin: "10%" },
      );
      rotateObserver.observe(cells);
      cleanups.push(() => {
        rotateObserver.disconnect();
        rotateCall?.kill();
        gsap.killTweensOf(live);
      });

      // ---- loop (mark + orbiting pills) ---------------------------------
      const loop = instance.querySelector<HTMLElement>(".stack_loop")!;
      const ring = loop.querySelector<SVGSVGElement>(".stack_ring")!;
      const nodes = [...loop.querySelectorAll<Node>(".stack_node")];
      const pills = nodes.map((n) => n.firstElementChild as HTMLElement);
      const hub = loop.querySelector(".stack_hub .stack_pill");
      const measureNodes = () => {
        for (const n of nodes) {
          const cs = getComputedStyle(n);
          n.bx = parseFloat(cs.left);
          n.by = parseFloat(cs.top);
        }
      };
      measureNodes();

      let orbit: gsap.core.Timeline | undefined;
      let orbitObserver: IntersectionObserver | undefined;
      const angle = { value: 0 };
      let setRing: (v: number) => void = () => {};
      let setters: [(v: number) => void, (v: number) => void][] = [];
      const renderOrbit = () => {
        const a = (angle.value * Math.PI) / 180;
        const c = Math.cos(a);
        const s = Math.sin(a);
        setRing(angle.value);
        nodes.forEach((n, i) => {
          const bx = n.bx ?? 0;
          const by = n.by ?? 0;
          const [sx, sy] = setters[i];
          sx(bx * c - by * s - bx);
          sy(bx * s + by * c - by);
        });
      };

      const loopState: { scroll?: ScrollTrigger } = {};
      const startOrbit = () => {
        loopState.scroll?.kill();
        if (orbit) return;
        setRing = gsap.quickSetter(ring, "rotate", "deg") as (v: number) => void;
        setters = pills.map((p) => [
          gsap.quickSetter(p, "x", "px") as (v: number) => void,
          gsap.quickSetter(p, "y", "px") as (v: number) => void,
        ]);
        orbit = gsap.timeline({ repeat: -1 });
        for (let i = 1; i <= 6; i++)
          orbit.to(angle, { value: i * 60, duration: M.orbitStep, ease: "power3.inOut", onUpdate: renderOrbit }, `+=${M.orbitPause}`);
        const o = orbit;
        orbitObserver = new IntersectionObserver(([e]) => (e.isIntersecting ? o.resume() : o.pause()), { rootMargin: "10%" });
        orbitObserver.observe(ring);
      };

      const ltl = gsap.timeline({ paused: true, onComplete: startOrbit });
      ltl.fromTo(ring, { autoAlpha: 0, scale: 0.15, rotate: -120 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.6, ease: "expo.out" }, 0);
      for (const side of instance.querySelectorAll(".stack_side")) {
        const [a, b] = side.querySelectorAll(".stack_line-in");
        ltl.fromTo(a, { yPercent: 115 }, { yPercent: 0, duration: 1.2, ease: "expo.out" }, 0.1);
        ltl.fromTo(b, { yPercent: -115 }, { yPercent: 0, duration: 1.2, ease: "expo.out" }, 0.1);
      }
      if (markEl) {
        gsap.set(markEl, { autoAlpha: 0 });
        ltl.call(
          () =>
            void markReady.then((anim) => {
              if (!anim || destroyed) return;
              gsap.set(markEl, { autoAlpha: 1 });
              anim.playSegments([anim.firstFrame, anim.firstFrame + M.markFrames], true);
            }),
          undefined,
          0.25,
        );
      }
      ltl.fromTo(hub, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }, 0.5);
      nodes.forEach((n, i) => {
        ltl.fromTo(
          pills[i],
          { autoAlpha: 0, scale: 0.4, x: -(n.bx ?? 0), y: -(n.by ?? 0) },
          { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.7, ease: "back.out(1.4)" },
          0.75 + i * 0.09,
        );
      });
      const playLoop = () => void ltl.play();
      loopState.scroll = ScrollTrigger.create({ trigger: loop, start: "top 75%", onEnter: playLoop, onLeave: playLoop });
      cleanups.push(() => {
        loopState.scroll?.kill();
        orbit?.kill();
        orbitObserver?.disconnect();
      });

      // ---- offer --------------------------------------------------------
      const badge = instance.querySelector(".stack_badge");
      const stem = instance.querySelector(".stack_stem");
      const stemDot = instance.querySelector(".stack_stem-dot");
      const loopsii = instance.querySelector<HTMLElement>(".stack_app--loopsii")!;
      const priceEl = loopsii.querySelector<HTMLElement>("[data-loopsii-price]")!;
      const target = Number(priceEl.textContent?.replace(/\D/g, ""));
      gsap.set([badge, loopsii], { autoAlpha: 0 });
      gsap.set(stem, { scaleY: 0 });
      gsap.set(stemDot, { scale: 0 });
      ScrollTrigger.create({
        trigger: loopsii,
        start: "top 90%",
        once: true,
        onEnter: () => {
          const s = { value: Math.round(live.reduce((sum, item) => sum + item.value, 0)) };
          gsap
            .timeline()
            .fromTo(badge, { autoAlpha: 0, scale: 0.4, rotate: -30 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.7, ease: "back.out(1.7)" }, 0)
            .fromTo(stem, { scaleY: 0 }, { scaleY: 1, duration: 0.4, ease: "power2.out" }, 0.4)
            .fromTo(stemDot, { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2.5)" }, 0.7)
            .fromTo(loopsii, { autoAlpha: 0, scale: 0.55, rotate: 4 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.7, ease: "back.out(1.6)" }, 0.8)
            .to(
              s,
              {
                value: target,
                duration: 1.1,
                ease: "power2.inOut",
                onUpdate: () => void (priceEl.textContent = Math.round(s.value).toLocaleString("en-US")),
              },
              1.1,
            );
        },
      });

      // ---- resize -------------------------------------------------------
      let lastWidth = window.innerWidth;
      let timer = 0;
      const onResize = () => {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (destroyed) return;
          measureNodes();
          if (orbit) renderOrbit();
          if (linesTl) initLines();
          if (headTl) {
            const done = headTl.progress() === 1;
            killHead();
            initHead();
            if (done) {
              headScroll?.kill();
              headTl?.progress(1);
            }
          }
        }, 150);
      };
      window.addEventListener("resize", onResize);
      cleanups.push(() => {
        window.removeEventListener("resize", onResize);
        window.clearTimeout(timer);
      });

      return () => {
        destroyed = true;
        cleanups.forEach((fn) => fn());
      };
    },
    scope,
  );
}
