import type { AnimationItem } from "lottie-web";

const cache = new WeakMap<HTMLElement, Promise<AnimationItem | null>>();

interface MountOptions {
  path: string;
  /** Park on this frame once the animation DOM is loaded. */
  frame?: number | null;
}

/**
 * Mounts a lottie (light SVG player, no autoplay / loop) into `container`.
 * Cached per container; resolves `null` when the animation fails to load.
 * Containers that already hold an SVG (e.g. the statically inlined mark) are left alone.
 */
export function mountLottie(container: HTMLElement, { path, frame = null }: MountOptions): Promise<AnimationItem | null> {
  const cached = cache.get(container);
  if (cached) return cached;
  if (container.querySelector("svg")) return Promise.resolve(null);

  const promise = import("lottie-web/build/player/lottie_light").then(
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
  cache.set(container, promise);
  return promise;
}

const isVisible = (node: Element, root: Element): boolean => {
  let current: Element | null = node;
  while (current && current !== root) {
    const style = getComputedStyle(current);
    if (style.display === "none" || parseFloat(style.opacity) === 0) return false;
    current = current.parentElement;
  }
  return true;
};

export interface Bounds {
  width: number;
  height: number;
  cx: number;
  cy: number;
}

/** Bounding box (viewport px) of the visible painted paths inside `root`. */
export function measureBounds(root: HTMLElement): Bounds | null {
  const rects = [...root.querySelectorAll("path")]
    .filter((path) => !path.closest("defs, mask, clipPath") && isVisible(path, root))
    .map((path) => path.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
  if (!rects.length) return null;
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return { width: right - left, height: bottom - top, cx: (left + right) / 2, cy: (top + bottom) / 2 };
}
