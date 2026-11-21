"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGsap } from "@/hooks/useGsap";
import { AGENT_EXCHANGES, AGENT_MOTION as M, type AgentExchange } from "@/constants/highlights";
import { prefersReducedMotion, snapshot, whileVisible, type Timeline } from "@/components/sections/highlights/motion";

const TOOL_ICONS = ["/highlights/icon-gear-search.svg", "/highlights/icon-gear-ask.svg"] as const;

function Exchange({ exchange }: { exchange: AgentExchange }) {
  return (
    <>
      <div className="agent_user flex w-full items-start justify-end">
        <div className="flex flex-col items-start rounded-15 rounded-br-5 bg-white px-18 py-16">
          <p className="agent_question min-h-42 w-318 ui-16 font-medium leading-1.3 text-[#1c1c1a]">{exchange.question}</p>
        </div>
      </div>
      <div className="agent_tools flex items-center gap-8">
        {exchange.tools.map((tool, i) => (
          <ToolChip key={tool} icon={TOOL_ICONS[i]} name={tool} arrow={i > 0} />
        ))}
      </div>
      <div className="agent_answer flex w-full items-start gap-14 overflow-clip rounded-15 bg-white p-20">
        <div className="agent_spark flex size-34 shrink-0 items-center justify-center rounded-10 bg-apricot">
          <Image src="/highlights/icon-spark.svg" alt="" width={18} height={18} unoptimized className="size-18 shrink-0" />
        </div>
        <div className="flex min-w-px flex-1 flex-col items-start gap-10">
          <p className="agent_line w-full ui-16 font-medium leading-none text-[#1c1c1a]">{exchange.line}</p>
          <div className="agent_quote flex w-full items-start gap-11" hidden={!exchange.quote}>
            <div className="w-3 shrink-0 self-stretch rounded-2 bg-apricot" />
            <p className="agent_quote-text min-w-px flex-1 ui-15 leading-1.4 text-[#56564f]">{exchange.quote}</p>
          </div>
          <div className="agent_meta flex w-full items-center justify-between">
            <p className="agent_source whitespace-nowrap ui-12 leading-none text-[#999991]">{exchange.source}</p>
            <div className="flex shrink-0 items-center overflow-clip rounded-7 bg-[#d9d9d9] px-5 py-2">
              <p className="agent_tag whitespace-nowrap ui-12 font-medium leading-none text-[#9c9c9c]">{exchange.tag}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ToolChip({ icon, name, arrow }: { icon: string; name: string; arrow: boolean }) {
  return (
    <>
      {arrow && <p className="agent_arrow whitespace-nowrap ui-13 font-medium text-[#b5b5ad]">→</p>}
      <div className="agent_tool flex items-center gap-7 overflow-clip rounded-9 border border-[#e2e2dd] bg-white px-11 py-7">
        <Image src={icon} alt="" width={14} height={14} unoptimized className="agent_tool-icon size-14 shrink-0" />
        <p className="whitespace-nowrap ui-12 font-medium leading-none text-[#77776f]">
          <span className="text-[#1c1c1a]">loopsii</span> · <span className="agent_tool-name">{name}</span>
        </p>
      </div>
    </>
  );
}

/** Card 5 — an AI agent querying the workspace through Loopsii tools. */
export function Agent() {
  const root = useRef<HTMLDivElement>(null);

  useGsap(
    (gsap) => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      const restore = snapshot(el);
      const thread = el.querySelector<HTMLElement>(".agent_thread")!;
      const templates = [".agent_user", ".agent_tools", ".agent_answer"].map(
        (s) => el.querySelector(s)!.cloneNode(true) as HTMLElement,
      );
      const state = { shift: M.maxShift };
      let index = 0;
      let active: Timeline | null = null;

      const unit = () => el.getBoundingClientRect().width / 635;
      const bottom = (n: HTMLElement) => (n.offsetTop + n.offsetHeight) / unit();
      const applyShift = () => thread.style.setProperty("--shift", String(state.shift));

      const build = (ex: AgentExchange) => {
        const [user, tools, answer] = templates.map((t) => t.cloneNode(true) as HTMLElement);
        const pick = <T extends HTMLElement = HTMLElement>(root: HTMLElement, s: string) => root.querySelector<T>(s)!;
        pick(user, ".agent_question").textContent = "";
        tools.querySelectorAll(".agent_tool-name").forEach((n, i) => (n.textContent = ex.tools[i]));
        pick(answer, ".agent_line").textContent = ex.line;
        pick(answer, ".agent_quote").hidden = !ex.quote;
        pick(answer, ".agent_quote-text").textContent = ex.quote ?? "";
        pick(answer, ".agent_source").textContent = ex.source;
        pick(answer, ".agent_tag").textContent = ex.tag;
        const nodes = [user, tools, answer];
        gsap.set(nodes, { autoAlpha: 0, y: 10 });
        thread.append(...nodes);
        return {
          user,
          question: pick(user, ".agent_question"),
          chips: [...tools.querySelectorAll<HTMLElement>(".agent_tool")],
          icons: [...tools.querySelectorAll<HTMLElement>(".agent_tool-icon")],
          arrow: pick(tools, ".agent_arrow"),
          answer,
          spark: pick(answer, ".agent_spark"),
          lines: [pick(answer, ".agent_line"), pick(answer, ".agent_quote"), pick(answer, ".agent_meta")],
        };
      };

      const prune = () => {
        const children = [...thread.children] as HTMLElement[];
        const gone = children.filter((c) => bottom(c) + state.shift < -10);
        if (!gone.length) return;
        state.shift += children[gone.length].offsetTop / unit();
        gone.forEach((c) => c.remove());
        applyShift();
      };

      const scroll = (tl: Timeline, target: HTMLElement, at: number, duration = 0.6) => {
        const shift = Math.min(M.maxShift, M.viewport - bottom(target));
        tl.to(state, { shift, duration, ease: "power2.inOut", onUpdate: applyShift }, at);
      };

      const step = () => {
        prune();
        const ex = AGENT_EXCHANGES[++index % AGENT_EXCHANGES.length];
        const n = build(ex);
        const typed = { n: 0 };
        const tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: step });
        scroll(tl, n.user, 0);
        tl.to(n.user, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.35).to(
          typed,
          {
            n: ex.question.length,
            duration: ex.question.length * M.typeSpeed,
            ease: "none",
            onUpdate: () => void (n.question.textContent = ex.question.slice(0, Math.round(typed.n))),
          },
          0.6,
        );
        const tools = 0.6 + ex.question.length * M.typeSpeed + 0.5;
        scroll(tl, n.chips[1].parentElement!, tools, 0.5);
        tl.fromTo(n.chips[0], { scale: 0.85 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35 }, tools)
          .fromTo(n.icons[0], { rotation: 0 }, { rotation: 360, duration: 0.9, ease: "power1.inOut" }, tools)
          .to(n.arrow, { autoAlpha: 1, y: 0, duration: 0.3 }, tools + 0.7)
          .fromTo(n.chips[1], { scale: 0.85 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35 }, tools + 0.9)
          .fromTo(n.icons[1], { rotation: 0 }, { rotation: 360, duration: 0.9, ease: "power1.inOut" }, tools + 0.9);
        const reply = tools + 1.9;
        scroll(tl, n.answer, reply, 0.7);
        tl.to(n.answer, { autoAlpha: 1, y: 0, duration: 0.5 }, reply + 0.1)
          .fromTo(n.spark, { scale: 0.4, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2)" }, reply + 0.15)
          .fromTo(n.lines, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.15 }, reply + 0.3)
          .to({}, { duration: M.hold }, reply + 1);
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
    <div ref={root} inert className="feature-visual agent relative h-470 w-635 shrink-0 overflow-clip rounded-20 bg-grey">
      <div className="absolute left-40 top-40 whitespace-nowrap visual-title text-black opacity-50">
        <p>Claude ·</p>
        <p>Connected to Loopsii</p>
      </div>
      <div className="agent_chat absolute left-40 top-110 h-320 w-555 overflow-clip">
        <div className="agent_thread absolute left-0 top-0 flex w-555 flex-col items-start gap-14">
          <Exchange exchange={AGENT_EXCHANGES[0]} />
        </div>
        <div className="agent_fade pointer-events-none absolute inset-x-0 top-0 h-60" />
      </div>
    </div>
  );
}
