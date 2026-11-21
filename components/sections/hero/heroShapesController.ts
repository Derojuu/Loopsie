import type { gsap as GsapType } from "gsap";
import {
  HERO_CELLS,
  HERO_LOOP_CELL,
  HERO_SHAPE_NAMES,
  HERO_SHAPE_WEIGHTS,
  HERO_SHAPES,
  HERO_SHAPES_MOTION,
  type HeroShape,
} from "@/constants/hero";
import { MEDIA } from "@/constants/motion";
import { isLoaderHeld, onLoaderRevealed } from "@/lib/loader-events";

type Gsap = typeof GsapType;

/** Shared, mutable clip/scroll state read every frame by the WebGL grid. */
export interface HeroGridState {
  clip: { left: number; right: number; top: number; bottom: number };
  /** True once the shapes frame drives the clip (otherwise the grid stays hidden). */
  ready: boolean;
  /** Freeze the grid's scroll offset (set while the intro is pinned). */
  scrollLocked: boolean;
  lockedScroll: number;
}

export const createHeroGridState = (): HeroGridState => ({
  clip: { left: 0, right: 0, top: 0, bottom: 0 },
  ready: false,
  scrollLocked: false,
  lockedScroll: 0,
});

interface Cell {
  el: HTMLElement;
  col0: number;
  row0: number;
  col: number;
  row: number;
  compact: number;
  svg: SVGSVGElement;
  path: SVGPathElement;
  shape: HeroShape;
  cx?: number;
  cy?: number;
  scaleTo?: (value: number) => void;
}

interface Move {
  index: number;
  fromCol: number;
  fromRow: number;
  col: number;
  row: number;
}

interface Step {
  moves: Move[];
  frame: number | null;
  stagger: number;
  hold: number;
}

interface FramePiece {
  el: HTMLElement;
  x: number;
  y: number;
  line: boolean;
  side: "left" | "right" | null;
  offX: number;
  offY: number;
  low: boolean;
}

const isTouch = () => window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const key = (col: number, row: number) => `${col}:${row}`;

/**
 * Port of the original `heroElements` module: an endless shuffle / compact /
 * morph timeline over the shape cells, a pointer "spotlight" that shrinks
 * nearby cells, and a per-frame sync of the frame lines, labels, clip-path and
 * WebGL grid mask with the `--g`, `--reveal` and `--hero-mask` variables.
 */
export class HeroShapesController {
  private readonly el: HTMLElement;
  private readonly box: HTMLElement;
  private readonly hero: HTMLElement;
  private readonly clipEl: HTMLElement;
  private cells: Cell[] = [];
  private fixed: { col: number; row: number }[] = [];
  private blocked = new Set<string>();
  private movers: Cell[] = [];
  private steps: Step[] = [];
  private cols = 0;
  private rows = 0;
  private visibleCols = 11;
  private tl?: gsap.core.Timeline;
  private inView = true;
  /** True while the page loader is up: the shapes loop (and title rotation) waits for the reveal. */
  private held = false;
  private destroyed = false;
  private observer?: IntersectionObserver;
  private ticks: (() => void)[] = [];
  private cleanups: (() => void)[] = [];

  // Frame sync
  private framePieces: FramePiece[] = [];
  private frameBox = { left: 0, right: 0, bottom: 0 };
  private frameLines = { left: 0, right: 0 };
  private frameEdges = { left: 0, right: 0 };
  private frameLift = 0;
  private clipBox = { left: 0, right: 0 };
  private clipPath = "";
  private maskKey: string | null = null;
  private maskLastScroll: number | null = null;
  private maskDirtyFrames = 0;
  private cssGrid: HTMLElement | null = null;
  private cssGridBox = { left: 0, right: 0, top: 0 };
  private cssGridClip: string | null = null;

  // Spotlight
  private mouse = { x: -9999, y: -9999 };
  private bounds?: DOMRect;
  private spotlightActive = false;
  private spotFrame = 0;

  constructor(
    private readonly gsap: Gsap,
    hero: HTMLElement,
    private readonly gridState: HeroGridState,
    private readonly onStep: () => void,
  ) {
    this.hero = hero;
    this.el = hero.querySelector<HTMLElement>(".hero-el")!;
    this.box = this.el.closest<HTMLElement>(".hero_bottom") ?? this.el;
    this.clipEl = this.el.closest<HTMLElement>(".hero-el-clip")!;
    this.setCells();
    this.setCell();
    if (!this.cells.length) return;
    this.startFrame();
    if (window.matchMedia(MEDIA.reducedMotion).matches) return;
    this.generateCompact();
    this.composeSteps();
    this.build();
    if (isLoaderHeld()) {
      this.held = true;
      this.tl?.pause();
      this.cleanups.push(
        onLoaderRevealed(() => {
          this.held = false;
          if (this.inView) this.tl?.play();
        }),
      );
    }
    if (window.matchMedia(MEDIA.finePointer).matches) this.startSpotlight();
    this.startVisibility();
  }

  private setCells(): void {
    const els = [...this.el.querySelectorAll<HTMLElement>(".hero-el_cell:not(.hero-el_loop)")];
    this.cells = els.map((el, i) => {
      const data = HERO_CELLS[i];
      return {
        el,
        col0: data.col,
        row0: data.row,
        col: data.col,
        row: data.row,
        compact: data.col,
        svg: el.querySelector("svg")!,
        path: el.querySelector("path")!,
        shape: data.shape,
      };
    });
    this.fixed = [{ col: HERO_LOOP_CELL.col, row: HERO_LOOP_CELL.row }];
    this.blocked = new Set(this.fixed.map((f) => key(f.col, f.row)));
    const all = [...HERO_CELLS, HERO_LOOP_CELL];
    this.cols = Math.max(...all.map((c) => c.col));
    this.rows = Math.max(...all.map((c) => c.row));
    this.box.style.setProperty("--g", "0");
  }

  private setCell(): void {
    this.visibleCols = parseFloat(getComputedStyle(this.box).getPropertyValue("--hero-cols")) || 11;
    const cell = (this.box.getBoundingClientRect().width + 2) / this.visibleCols;
    this.box.style.setProperty("--cell", `${cell}px`);
  }

  /** Target columns when the grid "breathes in" around the fixed loop cell. */
  private generateCompact(): void {
    const width = this.cols - 2;
    const byRow = new Map<number, Cell[]>();
    this.cells.forEach((c) => {
      if (!byRow.has(c.row0)) byRow.set(c.row0, []);
      byRow.get(c.row0)!.push(c);
    });
    const fixedByRow = new Map<number, Set<number>>();
    this.fixed.forEach((f) => {
      if (!fixedByRow.has(f.row)) fixedByRow.set(f.row, new Set());
      fixedByRow.get(f.row)!.add(f.col);
    });
    byRow.forEach((row, rowIndex) => {
      row.sort((a, b) => a.col0 - b.col0);
      const fixedCols = [...(fixedByRow.get(rowIndex) ?? [])].sort((a, b) => a - b);
      if (!fixedCols.length) {
        let col = 2 + Math.floor((width - row.length) / 2);
        row.forEach((c) => (c.compact = col++));
        return;
      }
      const first = fixedCols[0];
      const last = fixedCols[fixedCols.length - 1];
      let col = first - 1;
      row
        .filter((c) => c.col0 < first)
        .reverse()
        .forEach((c) => (c.compact = col--));
      col = last + 1;
      row.filter((c) => c.col0 > last).forEach((c) => (c.compact = col++));
      row.filter((c) => c.col0 > first && c.col0 < last).forEach((c) => (c.compact = c.col0));
    });
    this.movers = this.cells.filter((c) => c.compact !== c.col0);
  }

  /** Sliding-puzzle shuffle: N forward steps into empty slots, then the exact reverse. */
  private genShuffle(): Move[][] {
    const { forwardSteps, hRun, vRun, verticalBias, antiBacktrack } = HERO_SHAPES_MOTION;
    const dirs: [number, number][] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const shuffle = <T,>(arr: T[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    this.cells.forEach((c) => {
      c.col = c.col0;
      c.row = c.row0;
    });
    const occupied = new Map<string, number>();
    this.cells.forEach((c, i) => occupied.set(key(c.col, c.row), i));
    let lastDir = new Map<number, [number, number]>();
    const empties = () => {
      const out: [number, number][] = [];
      for (let r = 1; r <= this.rows; r++)
        for (let c = 1; c <= this.cols; c++)
          if (!occupied.has(key(c, r)) && !this.blocked.has(key(c, r))) out.push([c, r]);
      return out;
    };
    const inside = (c: number, r: number) => c >= 1 && c <= this.cols && r >= 1 && r <= this.rows;
    const pickDir = (candidates: [number, number][], c: number, r: number): [number, number] | null => {
      const options: { dir: [number, number]; weight: number }[] = [];
      candidates.forEach(([dc, dr]) => {
        const index = occupied.get(key(c + dc, r + dr))!;
        if (antiBacktrack && lastDir.has(index)) {
          const [pc, pr] = lastDir.get(index)!;
          if (pc === dc && pr === dr) return;
        }
        options.push({ dir: [dc, dr], weight: dr === 0 ? 1 : verticalBias });
      });
      if (!options.length) return null;
      let total = 0;
      options.forEach((o) => (total += o.weight));
      let roll = Math.random() * total;
      for (const o of options) {
        roll -= o.weight;
        if (roll < 0) return o.dir;
      }
      return options[options.length - 1].dir;
    };

    const forward: Move[][] = [];
    for (let s = 0; s < forwardSteps; s++) {
      const claimed = new Set<string>();
      const moves: Move[] = [];
      shuffle(empties()).forEach(([c, r]) => {
        const candidates = dirs.filter(
          ([dc, dr]) => occupied.has(key(c + dc, r + dr)) && !claimed.has(key(c + dc, r + dr)),
        );
        const dir = pickDir(candidates, c, r);
        if (!dir) return;
        const [dc, dr] = dir;
        const run = dr === 0 ? hRun : vRun;
        let mc = c + dc;
        let mr = r + dr;
        let n = 0;
        while (n < run && inside(mc, mr) && occupied.has(key(mc, mr)) && !claimed.has(key(mc, mr))) {
          n++;
          moves.push({ index: occupied.get(key(mc, mr))!, fromCol: mc, fromRow: mr, col: mc - dc, row: mr - dr });
          claimed.add(key(mc, mr));
          mc += dc;
          mr += dr;
        }
      });
      moves.forEach((m) => occupied.delete(key(m.fromCol, m.fromRow)));
      const dirsNow = new Map<number, [number, number]>();
      moves.forEach((m) => {
        occupied.set(key(m.col, m.row), m.index);
        this.cells[m.index].col = m.col;
        this.cells[m.index].row = m.row;
        dirsNow.set(m.index, [m.col - m.fromCol, m.row - m.fromRow]);
      });
      lastDir = dirsNow;
      forward.push(moves);
    }
    const backward: Move[][] = [];
    for (let s = forwardSteps - 1; s >= 0; s--) {
      backward.push(
        forward[s].map((m) => ({ index: m.index, fromCol: m.col, fromRow: m.row, col: m.fromCol, row: m.fromRow })),
      );
    }
    this.cells.forEach((c) => {
      c.col = c.col0;
      c.row = c.row0;
    });
    return [...forward, ...backward];
  }

  private compactMoves(inward: boolean): Move[] {
    return this.movers.map((c) => {
      const index = this.cells.indexOf(c);
      return inward
        ? { index, fromCol: c.col0, fromRow: c.row0, col: c.compact, row: c.row0 }
        : { index, fromCol: c.compact, fromRow: c.row0, col: c.col0, row: c.row0 };
    });
  }

  private composeSteps(): void {
    const { breatheCycles, stepStagger, stepHold, compactHold } = HERO_SHAPES_MOTION;
    this.steps = [];
    for (let i = 0; i < breatheCycles; i++) {
      const shuffle = this.genShuffle().map((moves) => ({ moves, frame: null, stagger: stepStagger, hold: stepHold }));
      this.steps.push(
        ...shuffle,
        { moves: this.compactMoves(true), frame: 1, stagger: 0, hold: compactHold },
        { moves: this.compactMoves(false), frame: 0, stagger: 0, hold: stepHold },
      );
    }
  }

  private build(): void {
    const { gsap } = this;
    const { stepDuration } = HERO_SHAPES_MOTION;
    this.tl?.kill();
    this.cells.forEach((c) => {
      c.el.style.setProperty("--col", String(c.col0));
      c.el.style.setProperty("--row", String(c.row0));
      c.el.style.setProperty("--s", "1");
      c.el.style.setProperty("--r", "0");
    });
    this.box.style.setProperty("--g", "0");
    this.tl = gsap.timeline({ repeat: -1, defaults: { duration: stepDuration, ease: "power2.inOut" } });
    let at = 0;
    this.steps.forEach((step) => {
      const end = this.addStep(step.moves, at, step.stagger);
      if (step.frame !== null) this.tl!.to(this.box, { "--g": step.frame, duration: stepDuration }, at);
      this.tl!.call(() => this.morphStep(), undefined, at);
      this.tl!.call(() => this.onStep(), undefined, at);
      at = end + step.hold;
    });
  }

  private addStep(moves: Move[], at: number, stagger: number): number {
    let end = at;
    moves.forEach((move, i) => {
      const cell = this.cells[move.index];
      const start = at + i * stagger;
      this.tl!.to(cell.el, { "--col": move.col, "--row": move.row }, start);
      end = Math.max(end, start + HERO_SHAPES_MOTION.stepDuration);
    });
    return end;
  }

  private morphStep(): void {
    const pool = this.cells.filter((c) => c.path);
    const count = Math.min(HERO_SHAPES_MOTION.shapeChangesPerStep, pool.length);
    for (let i = 0; i < count; i++) {
      const cell = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      const next = this.pickShape(cell.shape);
      cell.shape = next;
      this.gsap.to(cell.path, {
        morphSVG: HERO_SHAPES[next],
        duration: HERO_SHAPES_MOTION.stepDuration,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    }
  }

  private pickShape(current: HeroShape): HeroShape {
    const options = HERO_SHAPE_NAMES.filter((s) => s !== current);
    const total = options.reduce((sum, s) => sum + (HERO_SHAPE_WEIGHTS[s] || 1), 0);
    let roll = Math.random() * total;
    for (const s of options) {
      roll -= HERO_SHAPE_WEIGHTS[s] || 1;
      if (roll < 0) return s;
    }
    return options[options.length - 1];
  }

  private cacheCenters(): void {
    for (const c of this.cells) {
      const r = c.svg.getBoundingClientRect();
      c.cx = r.left + r.width / 2;
      c.cy = r.top + r.height / 2;
    }
  }

  private startSpotlight(): void {
    const { gsap } = this;
    const { spotlightRadius: radius, spotlightScale } = HERO_SHAPES_MOTION;
    this.bounds = this.el.getBoundingClientRect();
    this.cells.forEach((c) => {
      const sx = gsap.quickTo(c.svg, "scaleX", { duration: 0.4, ease: "power3.out" });
      const sy = gsap.quickTo(c.svg, "scaleY", { duration: 0.4, ease: "power3.out" });
      c.scaleTo = (v) => {
        sx(v);
        sy(v);
      };
    });
    const onPointerMove = (e: PointerEvent) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    };
    const onScroll = () => {
      this.bounds = this.el.getBoundingClientRect();
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    this.cleanups.push(() => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    });
    this.addTick(() => {
      if (!this.inView || !this.bounds) return;
      const b = this.bounds;
      const { x, y } = this.mouse;
      const near = x >= b.left - radius && x <= b.right + radius && y >= b.top - radius && y <= b.bottom + radius;
      if (!near) {
        if (this.spotlightActive) {
          this.cells.forEach((c) => c.scaleTo?.(1));
          this.spotlightActive = false;
        }
        return;
      }
      if (this.spotlightActive) {
        this.spotFrame = (this.spotFrame + 1) & 3;
        if (this.spotFrame === 0) this.cacheCenters();
      } else {
        this.cacheCenters();
        this.spotFrame = 0;
        this.spotlightActive = true;
      }
      for (const c of this.cells) {
        const dx = (c.cx ?? 0) - x;
        const dy = (c.cy ?? 0) - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        c.scaleTo?.(gsap.utils.clamp(spotlightScale, 1, gsap.utils.mapRange(0, radius, spotlightScale, 1, dist)));
      }
    });
  }

  private startVisibility(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.inView = entry.isIntersecting;
        if (entry.isIntersecting && !this.held) this.tl?.play();
        else this.tl?.pause();
      },
      { rootMargin: "120px" },
    );
    this.observer.observe(this.el);
  }

  private addTick(fn: () => void): void {
    this.ticks.push(fn);
    this.gsap.ticker.add(fn);
  }

  // ---- Frame (lines, labels, clip-path) + grid mask -------------------------------------------

  private startFrame(): void {
    const parent = this.box.querySelector(".hero_bottom-absolute-parent");
    if (!parent || this.box.querySelectorAll(".hero_bottom-y-line").length < 2) return;
    this.framePieces = [
      ...parent.querySelectorAll<HTMLElement>(".hero_bottom-x-line, .hero_bottom-y-line, .hero_label"),
    ].map((el) => ({
      el,
      x: 0,
      y: 0,
      line: el.classList.contains("hero_bottom-y-line"),
      side: null,
      offX: 0,
      offY: 0,
      low: false,
    }));
    this.measureFrame();
    this.syncFrame();
    this.addTick(() => {
      if (!this.inView) return;
      const scroll = window.scrollY;
      const heroStyle = this.hero.style;
      const k = `${this.box.style.getPropertyValue("--g")}|${heroStyle.getPropertyValue("--reveal")}|${heroStyle.getPropertyValue("--hero-mask")}`;
      const dirty = this.maskDirtyFrames > 0 || scroll !== this.maskLastScroll || k !== this.maskKey;
      if (this.maskDirtyFrames > 0) this.maskDirtyFrames--;
      this.maskLastScroll = scroll;
      this.maskKey = k;
      if (dirty) {
        this.syncFrame();
        this.syncMask();
      }
    });
  }

  private measureFrame(): void {
    const box = this.box.getBoundingClientRect();
    const clip = this.clipEl.getBoundingClientRect();
    const scrollY = window.scrollY;
    const center = (box.left + box.right) / 2;
    this.frameBox = { left: box.left, right: box.right, bottom: box.bottom + scrollY };
    this.cssGrid = isTouch() ? this.box.querySelector<HTMLElement>(".hero_grid") : null;
    if (this.cssGrid) this.measureCssGrid(box, scrollY);
    this.clipBox = { left: clip.left, right: clip.right };
    this.framePieces.forEach((p) => {
      const r = p.el.getBoundingClientRect();
      const [tx, ty] = getComputedStyle(p.el)
        .translate.split(" ")
        .map((v, i) => (v.endsWith("%") ? (parseFloat(v) / 100) * (i ? r.height : r.width) : parseFloat(v) || 0));
      const left = r.left - p.x - (tx || 0);
      const top = r.top + scrollY - p.y - (ty || 0);
      p.side = r.width > box.width ? null : left + r.width / 2 < center ? "left" : "right";
      p.offX = p.side ? left - box[p.side] : 0;
      p.low = r.height < box.height && top > box.top + scrollY + box.height / 2;
      p.offY = top - this.frameBox.bottom;
    });
    const leftLine = this.framePieces.find((p) => p.line && p.side === "left");
    const rightLine = this.framePieces.find((p) => p.line && p.side === "right");
    this.frameLines = {
      left: leftLine?.offX ?? 0,
      right: rightLine ? rightLine.offX + rightLine.el.getBoundingClientRect().width : 0,
    };
  }

  private syncFrame(): void {
    const heroStyle = this.hero.style;
    const g = parseFloat(this.box.style.getPropertyValue("--g")) || 0;
    const reveal = parseFloat(heroStyle.getPropertyValue("--reveal")) || 0;
    const mask = parseFloat(heroStyle.getPropertyValue("--hero-mask")) || 0;
    const cell = parseFloat(this.box.style.getPropertyValue("--cell")) || 0;
    const { left, right, bottom } = this.frameBox;
    const inset = ((g - ((this.cols - this.visibleCols) / 2) * reveal) * (right - left)) / this.visibleCols;
    const edges = { left: left + inset, right: right - inset };
    const dpr = window.devicePixelRatio || 1;
    const snap = (v: number) => Math.round(v * dpr) / dpr;
    this.frameLift = mask * cell * 2;
    this.frameEdges = { left: edges.left + this.frameLines.left, right: edges.right + this.frameLines.right };
    this.framePieces.forEach((p) => {
      const x = p.side ? snap(edges[p.side] + p.offX) - snap(this.frameBox[p.side] + p.offX) : 0;
      const y = p.low ? snap(bottom - this.frameLift + p.offY) - snap(bottom + p.offY) : 0;
      if (x !== p.x || y !== p.y) {
        p.x = x;
        p.y = y;
        p.el.style.transform = x || y ? `translate(${x}px, ${y}px)` : "";
      }
    });
    const clipPath = `inset(0px ${this.clipBox.right - snap(edges.right)}px ${this.frameLift}px ${snap(edges.left) - this.clipBox.left}px)`;
    if (clipPath !== this.clipPath) this.clipEl.style.clipPath = this.clipPath = clipPath;
  }

  private syncMask(): void {
    if (this.cssGrid) {
      this.syncCssGrid();
      return;
    }
    const box = this.box.getBoundingClientRect();
    const clip = this.gridState.clip;
    clip.left = this.frameEdges.left;
    clip.right = document.documentElement.clientWidth - this.frameEdges.right;
    clip.top = box.bottom - this.frameLift;
    clip.bottom = 0;
    this.gridState.ready = true;
  }

  private syncCssGrid(): void {
    if (!this.cssGrid) return;
    const b = this.cssGridBox;
    const clip = `inset(${this.frameBox.bottom - this.frameLift - b.top}px ${b.right - this.frameEdges.right}px 0px ${this.frameEdges.left - b.left}px)`;
    if (clip !== this.cssGridClip) this.cssGrid.style.setProperty("--grid-clip", (this.cssGridClip = clip));
  }

  private measureCssGrid(box: DOMRect, scrollY: number): void {
    if (!this.cssGrid) return;
    const distraction = document.querySelector(".distraction");
    const intro = document.querySelector(".intro");
    const depthEnd = distraction
      ? distraction.getBoundingClientRect().top + window.innerHeight
      : intro?.getBoundingClientRect().bottom;
    const style = this.cssGrid.style;
    if (depthEnd) style.setProperty("--grid-depth", `${depthEnd - box.bottom}px`);
    const r = this.cssGrid.getBoundingClientRect();
    const top = r.top + scrollY;
    const dpr = window.devicePixelRatio || 1;
    this.cssGridBox = { left: r.left, right: r.right, top };
    this.cssGridClip = null;
    style.setProperty("--grid-x", `${-r.left}px`);
    style.setProperty("--grid-y", `${Math.round(top * dpr) / dpr - top}px`);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.tl?.kill();
    this.observer?.disconnect();
    this.ticks.forEach((fn) => this.gsap.ticker.remove(fn));
    this.cleanups.forEach((fn) => fn());
    this.cells.forEach((c) => {
      this.gsap.killTweensOf(c.path);
      this.gsap.killTweensOf(c.svg);
      this.gsap.set(c.svg, { clearProps: "transform" });
      c.path.setAttribute("d", HERO_SHAPES[HERO_CELLS[this.cells.indexOf(c)].shape]);
      ["--col", "--row", "--s", "--r"].forEach((p) => c.el.style.removeProperty(p));
      c.el.style.setProperty("--col", String(c.col0));
      c.el.style.setProperty("--row", String(c.row0));
    });
    this.framePieces.forEach((p) => (p.el.style.transform = ""));
    this.clipEl.style.removeProperty("clip-path");
    this.gridState.ready = false;
  }
}
