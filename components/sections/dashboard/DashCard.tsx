import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/utils/cn";
import { DashImg } from "@/components/sections/dashboard/DashImg";

interface DashCardProps {
  label: string;
  pos: { readonly x: number; readonly y: number; readonly z: number };
  /** Extra classes for the `.dash-inner` panel (width, background, padding …). */
  innerClassName?: string;
  children: ReactNode;
}

/** Floating glass card with a black "loop" label tab; positioned in the 1920px design space. */
export function DashCard({ label, pos, innerClassName, children }: DashCardProps) {
  return (
    <div
      className="dash-card absolute flex flex-col items-start"
      style={{ "--x": pos.x, "--y": pos.y, "--z": pos.z } as CSSProperties}
    >
      <div className="dash-card_label flex items-center gap-6 self-start bg-black py-4 pl-7 pr-9 text-white">
        <DashImg name="label-loop" className="h-12 w-auto" />
        <span className="dash-card_label-text">{label}</span>
      </div>
      <div className="dash-card_body relative m-19">
        <div className="dash-card_frame pointer-events-none absolute -inset-19 border border-solid border-black dash-card_blur" />
        <div className={cn("dash-inner", innerClassName)}>{children}</div>
      </div>
    </div>
  );
}
