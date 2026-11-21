import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import {
  STACK_CTA,
  STACK_HUB,
  STACK_LINKS,
  STACK_LOOPSII,
  STACK_NODES,
  type StackApp,
} from "@/constants/stack";
import type { CSSProperties } from "react";

const formatPrice = (n: number) => `$${n.toLocaleString("en-US")}/yr`;

/** One SaaS tool card; its name/price rotate through `brands`. */
export function StackAppCard({ app }: { app: StackApp }) {
  const [name, price] = app.brands[0];
  return (
    <div
      className={cn(
        "stack_app relative flex size-230 flex-col justify-between place-self-center rounded-20 bg-white py-16 pr-24 pl-20",
        app.place,
      )}
      data-app={app.id}
      data-price={price}
      data-brands={JSON.stringify(app.brands)}
    >
      <div className="flex flex-col gap-16">
        <span className={cn("size-40 rounded-12", app.swatch)} />
        <div className="flex flex-col gap-2 whitespace-nowrap">
          <p className="stack_app-name stack_swap">
            <span className="stack_swap-in">{name}</span>
          </p>
          <p className="stack_app-role">{app.role}</p>
        </div>
      </div>
      <p className="stack_figure stack_app-price stack_swap whitespace-nowrap">
        <span className="stack_swap-in">{formatPrice(price)}</span>
      </p>
    </div>
  );
}

/** Coral arrows + hand-written notes revealed when hovering a card. */
export function StackLinks() {
  return (
    <>
      <svg className="stack_links pointer-events-none absolute top-0 left-0" viewBox="0 0 400 300" fill="none" aria-hidden="true">
        {STACK_LINKS.map((link) => (
          <g key={link.id} className="stack_link" data-link={link.id}>
            <path d={link.curve} />
            <path d={link.head} />
          </g>
        ))}
      </svg>
      {STACK_LINKS.map((link) => (
        <p
          key={link.id}
          className={cn("stack_link-note pointer-events-none font-hand", link.noteClass)}
          data-link={link.id}
          aria-hidden="true"
        >
          <span className="block">{link.note[0]}</span>
          <span className="block">{link.note[1]}</span>
        </p>
      ))}
    </>
  );
}

/** Running totals + "you keep them in sync" cell. */
export function StackStats() {
  return (
    <>
      <p className="stack_stat col-start-6 row-start-2 flex flex-col justify-end pb-8 pl-20 l:col-start-2 l:row-start-4 s:col-start-1">
        <span className="stack_stat-num">
          <span className="stack_figure">$</span>
          <span data-total>0</span>
          <span className="stack_stat-plus" data-plus>
            +
          </span>
        </span>
        <span className="stack_figure stack_stat-label">a year</span>
      </p>
      <p className="stack_stat col-start-8 row-start-2 flex flex-col justify-end pb-8 pl-20 l:col-start-4 l:row-start-4 s:col-start-2">
        <span className="stack_stat-num">
          <span data-logins>0</span>
          <span className="stack_stat-plus" data-plus>
            +
          </span>
        </span>
        <span className="stack_figure stack_stat-label" data-logins-label>
          logins
        </span>
      </p>
      <div className="stack_sync relative col-start-7 row-start-3 flex items-end pb-7 pl-20 l:col-start-3 l:row-start-5 s:col-start-1">
        <p className="stack_figure stack_sync-text">
          <span className="block">you keep</span>
          <span className="block">them</span>
          <span className="block">in sync</span>
        </p>
        <span className="stack_dot stack_dot--tl" aria-hidden="true" />
        <span className="stack_dot stack_dot--bl" aria-hidden="true" />
        <span className="stack_dot stack_dot--tr" aria-hidden="true" />
      </div>
    </>
  );
}

/** Loopsii mark (lottie, filled at runtime) with the orbiting ring of pills. */
export function StackLoop() {
  return (
    <div className="stack_loop pointer-events-none absolute">
      <div className="stack_mark" aria-hidden="true" />
      <svg className="stack_ring" viewBox="0 0 478 478" fill="none" aria-hidden="true">
        <circle cx="239" cy="239" r="238" stroke="currentColor" strokeWidth="2" pathLength="150" strokeDasharray="1 1" />
      </svg>
      <p className="stack_hub">
        <span className="stack_pill stack_pill--hub">{STACK_HUB}</span>
      </p>
      {STACK_NODES.map((node) => (
        <span key={node.label} className="stack_node" style={{ "--x": node.x, "--y": node.y } as CSSProperties}>
          <span className="stack_pill">{node.label}</span>
        </span>
      ))}
    </div>
  );
}

const OFFER_PLACE = "col-span-2 col-start-4 row-start-7 l:col-start-2 l:row-start-10 s:col-start-1 s:row-start-9";

/** Lime badge → stem → Loopsii price card. */
export function StackOffer() {
  return (
    <>
      <div
        className={cn(
          "stack_badge flex size-100 items-center justify-center place-self-center rounded-20 bg-main text-black",
          OFFER_PLACE,
        )}
        aria-hidden="true"
      >
        <svg className="w-68" viewBox="0 0 302 223" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M81.5169 10.2828C104.364 -1.29273 130.995 -4.66463 153.653 8.41482C176.312 21.4968 186.71 46.2458 188.109 71.821C189.228 92.2905 184.798 114.81 175.185 136.638L153.867 140.16L142.72 123.218C150.593 105.632 153.824 88.2824 153.028 73.7348C152.032 55.5237 145.101 44.0416 136.086 38.837C127.071 33.6354 113.666 33.3782 97.399 41.62C81.2988 49.7779 64.5559 65.4331 52.0021 87.177C39.4498 108.92 34.2653 131.243 35.2508 149.264C36.2471 167.473 43.1723 178.956 52.1851 184.162C61.1994 189.366 74.6113 189.62 90.8799 181.379C104.321 174.568 118.193 162.524 129.72 146.085L142.651 165.756L160.904 162.737C146.081 185.034 127.027 202.448 106.762 212.716C83.914 224.292 57.2765 227.666 34.618 214.584C11.9637 201.501 1.5687 176.751 0.170048 151.178C-1.23811 125.415 6.11698 96.3936 21.5799 69.6099C37.0434 42.8264 58.5015 21.9456 81.5169 10.2828Z" />
          <path d="M200.445 144.387L148.406 152.979L119.434 108.912L139.004 96.0402L159.615 127.381L196.625 121.272L200.445 144.387Z" />
          <g transform="translate(117.375)">
            <path d="M118.929 165.764L137.174 162.744C122.352 185.037 103.302 202.449 83.0395 212.716C60.1915 224.292 33.554 227.666 10.8956 214.584C6.88255 212.267 3.26165 209.575 0 206.586C9.63126 200.38 18.8519 192.583 27.3037 183.43C27.6889 183.681 28.0692 183.935 28.4626 184.162C37.477 189.366 50.8888 189.62 67.1575 181.379C80.5983 174.568 94.4707 162.524 105.997 146.085L118.929 165.764ZM57.7945 10.2828C80.6414 -1.29273 107.273 -4.66463 129.931 8.41482C152.589 21.4968 162.988 46.2458 164.386 71.821C165.505 92.2905 161.076 114.81 151.463 136.638L130.144 140.16L118.997 123.218C126.871 105.632 130.101 88.2824 129.306 73.7348C128.309 55.5237 121.378 44.0416 112.364 38.837C103.349 33.6354 89.9434 33.3782 73.6765 41.62C71.107 42.9219 68.5277 44.4252 65.9452 46.1032C62.1254 34.7644 55.9931 24.473 47.1887 16.4054C50.6792 14.1559 54.2119 12.0983 57.7945 10.2828Z" />
            <path d="M176.695 144.387L124.656 152.979L95.684 108.912L115.254 96.0402L135.865 127.381L172.875 121.272L176.695 144.387Z" />
          </g>
        </svg>
      </div>
      <span className={cn("stack_stem self-end justify-self-center", OFFER_PLACE)} aria-hidden="true" />
      <span className={cn("stack_stem-dot self-end justify-self-center", OFFER_PLACE)} aria-hidden="true" />
      <div className="stack_app stack_app--loopsii relative col-span-2 col-start-4 row-start-8 flex h-232 w-472 flex-col items-center justify-between place-self-center rounded-20 bg-white pt-29 pb-16 text-center l:col-start-2 l:row-start-11 s:col-start-1 s:row-start-10">
        <div className="flex flex-col gap-1 whitespace-nowrap">
          <p className="stack_figure">{STACK_LOOPSII.name}</p>
          <p className="stack_app-name">{STACK_LOOPSII.tagline}</p>
        </div>
        <p className="stack_stat-num whitespace-nowrap">
          <span className="stack_figure">$</span>
          <span data-loopsii-price>{STACK_LOOPSII.price}</span>
          <span className="stack_figure">/yr</span>
        </p>
      </div>
    </>
  );
}

/** Lime "Move in without leaving anything behind" band. */
export function StackCta() {
  return (
    <div className="container max-w-none px-cont">
      <div className="stack_cta mt-40 flex items-center gap-120 rounded-60 bg-main px-80 py-70 shadow-[0_4px_90px_rgba(0,0,0,0.05)] l:flex-col l:items-start l:gap-40 l:rounded-30 l:p-40 s:gap-24 s:rounded-20 s:p-20">
        <div className="w-690 shrink-0 l:w-auto">
          <h3 className="stack_cta-title max-w-599 l:max-w-480">{STACK_CTA.title}</h3>
        </div>
        <div className="flex w-914 flex-col items-center pt-60 l:w-auto l:items-start l:pt-0">
          <div className="flex flex-col items-start gap-30 l:gap-24">
            <p className="text-lead-semi max-w-706">{STACK_CTA.body}</p>
            <Button label={STACK_CTA.button} track={STACK_CTA.track} />
          </div>
        </div>
      </div>
    </div>
  );
}
