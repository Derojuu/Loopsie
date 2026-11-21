import { cn } from "@/utils/cn";
import { HERO_LABELS } from "@/constants/hero";

/** Crosshair frame lines + corner labels around the shapes grid (moved by `HeroController`). */
export function HeroFrame() {
  return (
    <div className="hero_bottom-absolute-parent absolute inset-0">
      <div className="hero_bottom-lines absolute inset-0">
        <div className="hero_bottom-x-line absolute -left-[100vw] -right-[100vw] h-px bg-border -bottom-px" />
        <div className="hero_bottom-x-line absolute -left-[100vw] -right-[100vw] h-px bg-border -top-px" />
        <div className="hero_bottom-y-line -left-px absolute w-px bg-border" />
        <div className="hero_bottom-y-line -right-px absolute w-px bg-border" />
      </div>
      <div className="hero_labels absolute inset-0 z-2">
        {HERO_LABELS.map((label) => (
          <div key={label.text} className={cn("hero_label absolute", label.className)}>
            <div className="hero_label-dot size-8 bg-black s:size-6" />
            <div className={cn("hero_label-text absolute label", label.textClassName)}>{label.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
