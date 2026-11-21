import type { CSSProperties } from "react";
import { cn } from "@/utils/cn";
import { HERO_CELLS, HERO_GRID_COLS, HERO_LOOP_CELL, HERO_SHAPES } from "@/constants/hero";

const cellVars = (row: number, col: number) =>
  ({ "--col0": col, "--row0": row, "--col": col, "--row": row }) as CSSProperties;

/** The 21×3 grid of colourful geometric cells (shuffled / morphed by `HeroController`). */
export function HeroShapes() {
  return (
    <div className="hero-el-clip">
      <div className="hero-el" style={{ "--cols": HERO_GRID_COLS } as CSSProperties}>
        {HERO_CELLS.map((cell) => (
          <div
            key={`${cell.row}/${cell.col}`}
            className={cn("hero-el_cell", cell.filler && "hero-el_filler")}
            style={cellVars(cell.row, cell.col)}
            data-shape={cell.shape}
          >
            <svg className="hero-el_svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d={HERO_SHAPES[cell.shape]} fill={`var(--color-${cell.color})`} />
            </svg>
          </div>
        ))}
        <div
          className="hero-el_cell hero-el_loop hero-el_circle bg-coral invisible l:visible"
          style={cellVars(HERO_LOOP_CELL.row, HERO_LOOP_CELL.col)}
        >
          <div className="hero-el_mark w-[36%] aspect-[300/330]" />
        </div>
      </div>
    </div>
  );
}
