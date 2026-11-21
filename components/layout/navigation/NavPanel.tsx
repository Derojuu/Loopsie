import { Button } from "@/components/ui/Button";
import { NAV_PANEL, NAV_PANEL_DOTS, NAV_PANEL_LINES } from "@/constants/navigation";

/** Expandable panel shown when the nav morphs into the footer card. */
export function NavPanel() {
  return (
    <div className="nav_panel w-full" aria-hidden="true">
      <div className="nav_outro relative flex min-h-[calc(100svh-var(--spacing)*250)] flex-col items-center justify-center gap-16 px-30 py-80 text-center l:min-h-[calc(100svh-var(--spacing)*124)] l:gap-20 s:min-h-[calc(var(--spacing)*378)] s:py-60">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {NAV_PANEL_LINES.map((className) => (
            <div key={className} className={className} />
          ))}
          {NAV_PANEL_DOTS.map((className) => (
            <div key={className} className={className} />
          ))}
        </div>
        <div data-overlay-reveal>
          <p className="h2 nav_outro-title l:max-w-337 s:max-w-190">{NAV_PANEL.title}</p>
        </div>
        <p data-overlay-reveal className="nav_outro-note text-note font-hand l:max-w-337 s:max-w-243">
          {NAV_PANEL.note}
        </p>
        <div data-overlay-reveal className="mt-44 l:mt-20">
          <Button track="nav-panel-signup" />
        </div>
      </div>
    </div>
  );
}
