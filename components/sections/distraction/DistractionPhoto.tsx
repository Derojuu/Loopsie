"use client";

import { useEffect, useRef } from "react";
import { DISTRACTION_PHOTO, DISTRACTION_PHOTO_PARAMS as P } from "@/constants/distraction";
import { cn } from "@/utils/cn";

const supportsCanvasFilter = (ctx: CanvasRenderingContext2D) => {
  ctx.filter = "blur(1px)";
  const ok = ctx.filter === "blur(1px)";
  ctx.filter = "none";
  return ok;
};

/**
 * Bakes a gaussian-blurred copy of the image. Edges are clamped (stretched)
 * before blurring to match the WebGL CLAMP_TO_EDGE sampling of the original.
 */
function bake(img: HTMLImageElement): HTMLCanvasElement {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const sigma = Math.max(0.01, (P.blur * w) / (1920 * P.zoom));
  const pad = Math.ceil(sigma * 3);

  const padded = document.createElement("canvas");
  padded.width = w + pad * 2;
  padded.height = h + pad * 2;
  const pc = padded.getContext("2d")!;
  pc.drawImage(img, pad, pad, w, h);
  // Clamp edges: stretch the outermost pixel rows / columns into the padding.
  pc.drawImage(img, 0, 0, w, 1, pad, 0, w, pad);
  pc.drawImage(img, 0, h - 1, w, 1, pad, h + pad, w, pad);
  pc.drawImage(padded, pad, 0, 1, padded.height, 0, 0, pad, padded.height);
  pc.drawImage(padded, pad + w - 1, 0, 1, padded.height, pad + w, 0, pad, padded.height);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const oc = out.getContext("2d")!;
  if (supportsCanvasFilter(oc)) {
    oc.filter = `blur(${sigma}px)`;
    oc.drawImage(padded, -pad, -pad);
    oc.filter = "none";
  } else {
    // Fallback (no ctx.filter, e.g. older Safari): down/up-sample blur.
    const factor = Math.max(1, sigma / 1.5);
    const tiny = document.createElement("canvas");
    tiny.width = Math.max(1, Math.round(padded.width / factor));
    tiny.height = Math.max(1, Math.round(padded.height / factor));
    const tc = tiny.getContext("2d")!;
    tc.imageSmoothingQuality = "high";
    tc.drawImage(padded, 0, 0, tiny.width, tiny.height);
    oc.imageSmoothingQuality = "high";
    oc.drawImage(tiny, 0, 0, tiny.width, tiny.height, -pad, -pad, padded.width, padded.height);
  }
  return out;
}

/**
 * Dark blurred cover photo behind the distraction section. Canvas 2D port of
 * the original OGL pipeline (separable gaussian bake → cover-fit + shade).
 */
export function DistractionPhoto({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    let destroyed = false;
    let baked: HTMLCanvasElement | null = null;
    let aspect = 1;
    let resizeObserver: ResizeObserver | undefined;

    const draw = () => {
      const { offsetWidth: w, offsetHeight: h } = parent;
      if (destroyed || !baked || !w || !h) return;
      const cw = Math.max(1, Math.round(w * P.dpr));
      const ch = Math.max(1, Math.round(h * P.dpr));
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const n = aspect / (w / h);
      const r = Math.max(P.zoom, n);
      const sx = 1 / r;
      const sy = n / r;
      const cx = Math.min(Math.max(P.x, sx / 2), 1 - sx / 2);
      const cy = Math.min(Math.max(P.y, sy / 2), 1 - sy / 2);
      const bw = baked.width;
      const bh = baked.height;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(baked, (cx - sx / 2) * bw, (1 - cy - sy / 2) * bh, sx * bw, sy * bh, 0, 0, cw, ch);
      // color *= shade
      ctx.globalCompositeOperation = "multiply";
      const s = Math.round(P.shade * 255);
      ctx.fillStyle = `rgb(${s},${s},${s})`;
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = "source-over";
      canvas.classList.add("is-ready");
    };

    const load = async () => {
      const img = new Image();
      img.src = canvas.dataset.src ?? DISTRACTION_PHOTO;
      await img.decode().catch(() => null);
      if (destroyed || !img.naturalWidth) return;
      aspect = img.naturalWidth / img.naturalHeight;
      baked = bake(img);
      draw();
      resizeObserver = new ResizeObserver(draw);
      resizeObserver.observe(parent);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        void load();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(canvas);

    return () => {
      destroyed = true;
      io.disconnect();
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={cn("distraction_photo pointer-events-none absolute inset-0 size-full", className)}
      data-src={DISTRACTION_PHOTO}
      aria-hidden="true"
    />
  );
}
