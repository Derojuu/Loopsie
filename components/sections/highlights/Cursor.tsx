import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/utils/cn";
import type { Point } from "@/components/sections/highlights/motion";

const POINTERS = {
  arrow: { src: "/highlights/cursor-arrow.svg", size: "h-14 w-13", width: 13, height: 14, tag: "left-10 top-12" },
  hand: { src: "/highlights/cursor-hand.svg", size: "h-9 w-8", width: 8, height: 9, tag: "left-8 top-11" },
} as const;

interface CursorProps {
  kind: keyof typeof POINTERS;
  label: string;
  at: Point;
  className?: string;
}

/** Multiplayer-style cursor with a name tag, positioned in illustration units. */
export function Cursor({ kind, label, at, className }: CursorProps) {
  const pointer = POINTERS[kind];
  return (
    <div className={cn("unit-pos", className)} style={{ "--x": at.x, "--y": at.y } as CSSProperties}>
      <Image
        src={pointer.src}
        alt=""
        width={pointer.width}
        height={pointer.height}
        unoptimized
        className={cn("block", pointer.size)}
      />
      <div
        className={cn(
          "absolute flex h-23 items-start rounded-14 rounded-tl-1 border-1 border-[#6f6f6f] bg-black py-5 pl-9 pr-12 ui-9 font-medium leading-1.5 text-white",
          pointer.tag,
        )}
      >
        {label}
      </div>
    </div>
  );
}
