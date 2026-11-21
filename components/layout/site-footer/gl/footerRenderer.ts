import { CANVAS_DPR, FOOTER_PARAMS } from "@/constants/footer";
import { FluidSim } from "./fluid";
import { createBlackTexture, createProgram, createQuad, createTexture, hexToRgb } from "./utils";

/* Port of the original `footer` GL module: the footer video (packed colour +
   depth panes) is rendered as an 8px dot-matrix over a blue checker of dots.
   Cells near the cursor turn into "+" glyphs via a fluid simulation, and the
   whole layer reveals bottom-up (jittered per cell) as the footer scrolls in. */

const VERTEX = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform sampler2D uTexture;
uniform float uHasVideo;
uniform vec2 uVideoRes;
uniform float uCellSize;
uniform vec3 uBgColor;
uniform vec3 uBgDot1;
uniform vec3 uBgDot2;
uniform vec3 uFigureColor;
uniform vec3 uCellColor;
uniform vec3 uCrossColor;
uniform float uDepthHi;
uniform float uDepthLo;
uniform float uLumaDark;
uniform float uPackScale;
uniform float uSideOff;
uniform float uJitter;
uniform float uScale;
uniform float uOffsetY;
uniform float uDotSize;
uniform float uArmW;
uniform float uPad;
uniform vec2 uSideCenter;
uniform float uSideWidth;
uniform float uSingle;
uniform float uTime;
uniform float uAnimSpeed;
uniform sampler2D uFluid;
uniform vec2 uViewport;
uniform float uFluidStrength;
uniform float uFluidSwell;
uniform float uPulse;
uniform float uPulseScramble;
uniform float uReveal;
uniform float uRevealJitter;
uniform float uVideoHide;

in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 glyphColor(vec2 cellUv) {
  float vBar = step(abs(cellUv.x - 0.5), uArmW) * step(abs(cellUv.y - 0.5), 0.5 - uPad);
  float hBar = step(abs(cellUv.y - 0.5), uArmW) * step(abs(cellUv.x - 0.5), 0.5 - uPad);
  float crossMask = clamp(vBar + hBar, 0.0, 1.0);
  return mix(uCellColor, uCrossColor, crossMask);
}

void main() {
  vec2 px = vUv * uViewport;
  vec2 cell = floor(px / uCellSize);
  vec2 cellUv = fract(px / uCellSize);

  vec2 sub = floor(cellUv * 2.0);
  vec2 subUv = fract(cellUv * 2.0);
  float checker = mod(cell.x + cell.y + sub.x + sub.y, 2.0);
  vec3 dotCol = mix(uBgDot1, uBgDot2, checker);
  float mask = step(max(abs(subUv.x - 0.5), abs(subUv.y - 0.5)), uDotSize);
  vec3 col = mix(uBgColor, dotCol, mask);

  vec2 cellCenter = (cell + 0.5) * uCellSize;
  float h = hash(cell + floor(uTime * uAnimSpeed) + floor(uPulse * uPulseScramble));

  vec2 fluidUv = cellCenter / uViewport;
  float energy = texture(uFluid, fluidUv).r;

  if (energy * uFluidStrength > 0.3 + h * 0.6) col = glyphColor(cellUv);

  if (uHasVideo > 0.5 && hash(cell * 2.17 + 5.3) >= uVideoHide) {
    float halfW = uViewport.x * 0.5;
    float sideIdx = uSingle > 0.5 || cellCenter.x < halfW ? 0.0 : 1.0;

    float s = min(uSideWidth / uVideoRes.x, uViewport.y / uVideoRes.y) * uScale;
    vec2 vidSize = uVideoRes * s;
    float centerX = mix(uSideCenter.x, uSideCenter.y, sideIdx);
    vec2 offset = vec2(centerX - vidSize.x * 0.5, (uViewport.y - vidSize.y) * uOffsetY);

    vec2 vidUv = (cellCenter - offset) / vidSize;

    if (vidUv.x >= 0.0 && vidUv.x <= 1.0 && vidUv.y >= 0.0 && vidUv.y <= 1.0) {
      vidUv.x = clamp(vidUv.x, 0.006, 0.994);

      float paneX = sideIdx * uSideOff + vidUv.x * uPackScale;
      vec3 vidCol = texture(uTexture, vec2(paneX, vidUv.y)).rgb;
      float depth = texture(uTexture, vec2(paneX + uPackScale, vidUv.y)).r;

      depth += (h - 0.5) * uJitter + energy * uFluidSwell;

      float luma = dot(vidCol, vec3(0.299, 0.587, 0.114));

      if (depth > uDepthHi) {
        if (luma < uLumaDark) col = glyphColor(cellUv);
        else col = uFigureColor;
      } else if (depth > uDepthLo) {
        col = glyphColor(cellUv);
      }
    }
  }

  float grad = cellCenter.y / uViewport.y;
  float rh = hash(cell * 1.37 + 13.7);
  float revealT = mix(grad, rh, uRevealJitter);
  float alpha = step(revealT, uReveal);

  fragColor = vec4(col * alpha, alpha);
}`;

const UNIFORMS = [
  "uTexture", "uHasVideo", "uVideoRes", "uCellSize", "uBgColor", "uBgDot1", "uBgDot2", "uFigureColor",
  "uCellColor", "uCrossColor", "uDepthHi", "uDepthLo", "uLumaDark", "uPackScale", "uSideOff", "uJitter",
  "uScale", "uOffsetY", "uDotSize", "uArmW", "uPad", "uSideCenter", "uSideWidth", "uSingle", "uTime",
  "uAnimSpeed", "uFluid", "uViewport", "uFluidStrength", "uFluidSwell", "uPulse", "uPulseScramble",
  "uReveal", "uRevealJitter", "uVideoHide",
] as const;

const TABLET = "(max-width: 1023px)";
const isMobileUA = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/**
 * Mounts the footer effect on `canvas` (the fixed global canvas), driven by the
 * scroll position of `section`. Returns a cleanup function, or null without WebGL2.
 */
export function mountFooterRenderer(canvas: HTMLCanvasElement, section: HTMLElement, videoSrc: string): (() => void) | null {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const p = FOOTER_PARAMS;
  const quad = createQuad(gl);
  const { program, uniforms: u } = createProgram(gl, VERTEX, FRAGMENT, UNIFORMS);
  const black = createBlackTexture(gl);
  const videoTexture = createTexture(gl, gl.LINEAR);
  const fluid = isMobileUA() ? null : FluidSim.create(gl, quad.vao);

  const size = { width: 1, height: 1 };
  const side = { single: 0, left: 0, right: 0, width: 0 };
  const video = { hasVideo: 0, packScale: 0.5, sideOff: 0, resX: 960, resY: 534, bound: false, frameReady: false, lastTime: -1 };
  let pulse = 0;
  let visible = false;
  let inView = false;
  let raf = 0;
  let lastFrame = performance.now();
  const start = lastFrame;

  // Static uniforms.
  gl.useProgram(program);
  gl.uniform1f(u.uCellSize, p.cellSize);
  gl.uniform3f(u.uBgColor, ...hexToRgb(p.bgColor));
  gl.uniform3f(u.uBgDot1, ...hexToRgb(p.bgDot1));
  gl.uniform3f(u.uBgDot2, ...hexToRgb(p.bgDot2));
  gl.uniform3f(u.uFigureColor, ...hexToRgb(p.figureColor));
  gl.uniform3f(u.uCellColor, ...hexToRgb(p.cellColor));
  gl.uniform3f(u.uCrossColor, ...hexToRgb(p.crossColor));
  gl.uniform1f(u.uDepthHi, p.depthHi);
  gl.uniform1f(u.uDepthLo, p.depthLo);
  gl.uniform1f(u.uLumaDark, p.lumaDark);
  gl.uniform1f(u.uJitter, p.jitter);
  gl.uniform1f(u.uScale, p.scale);
  gl.uniform1f(u.uOffsetY, p.offsetY);
  gl.uniform1f(u.uDotSize, p.dotSize);
  gl.uniform1f(u.uArmW, p.armW);
  gl.uniform1f(u.uPad, p.pad);
  gl.uniform1f(u.uAnimSpeed, p.animSpeed);
  gl.uniform1f(u.uFluidStrength, p.fluidStrength);
  gl.uniform1f(u.uFluidSwell, p.fluidSwell);
  gl.uniform1f(u.uPulseScramble, p.pulseScramble);
  gl.uniform1f(u.uRevealJitter, p.revealJitter);
  gl.uniform1f(u.uVideoHide, 0);
  gl.uniform1i(u.uTexture, 0);
  gl.uniform1i(u.uFluid, 1);

  /* --- layout --- */
  const setSideCenters = () => {
    const w = size.width;
    if (window.matchMedia(TABLET).matches) {
      Object.assign(side, { single: 1, left: w * 0.5, right: w * 0.5, width: w });
      return;
    }
    // Two copies of the video, one in each gutter beside the centred footer card.
    const legal = document.querySelector<HTMLElement>(".nav_legal");
    const gutter = legal ? Math.max((w - legal.offsetWidth) * 0.5, 0) : w * 0.5;
    Object.assign(side, { single: 0, left: gutter * 0.5, right: w - gutter * 0.5, width: gutter });
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, CANVAS_DPR.max);
    size.width = canvas.clientWidth || window.innerWidth;
    size.height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(size.width * dpr);
    canvas.height = Math.round(size.height * dpr);
    fluid?.setAspect(size.width, size.height);
    setSideCenters();
    if (visible) draw();
  };

  /* --- video --- */
  const el = document.createElement("video");
  el.muted = true;
  el.loop = true;
  el.playsInline = true;
  el.autoplay = false;
  el.preload = "metadata";
  el.crossOrigin = "anonymous";
  let rvfc = 0;
  const hasRVFC = typeof (el as Partial<HTMLVideoElement>).requestVideoFrameCallback === "function";
  if (hasRVFC) {
    const onFrame = () => {
      video.frameReady = true;
      rvfc = el.requestVideoFrameCallback(onFrame);
    };
    rvfc = el.requestVideoFrameCallback(onFrame);
  }

  const uploadVideo = (): boolean => {
    if (el.readyState < 2) return false;
    let fresh = !video.bound;
    if (hasRVFC) {
      if (video.frameReady) {
        video.frameReady = false;
        fresh = true;
      }
    } else if (el.currentTime !== video.lastTime) {
      video.lastTime = el.currentTime;
      fresh = true;
    }
    if (fresh) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, videoTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      video.bound = true;
    }
    if (el.videoWidth && !video.hasVideo) {
      // A >2:1 video packs both sides: [colour L | depth L | colour R | depth R].
      const dual = el.videoWidth / el.videoHeight > 2;
      video.packScale = dual ? 0.25 : 0.5;
      video.sideOff = dual ? 0.5 : 0;
      video.resX = el.videoWidth * video.packScale;
      video.resY = el.videoHeight;
      video.hasVideo = 1;
    }
    return fresh;
  };

  /* --- render --- */
  const draw = () => {
    const rect = section.getBoundingClientRect();
    const reveal = Math.min(Math.max((size.height - rect.top) / (size.height * p.revealSpan), 0), 1) * 1.02;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.BLEND);
    gl.useProgram(program);
    gl.bindVertexArray(quad.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, video.bound ? videoTexture : black);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, fluid?.texture ?? black);

    gl.uniform1f(u.uHasVideo, video.hasVideo);
    gl.uniform2f(u.uVideoRes, video.resX, video.resY);
    gl.uniform1f(u.uPackScale, video.packScale);
    gl.uniform1f(u.uSideOff, video.sideOff);
    gl.uniform2f(u.uSideCenter, side.left, side.right);
    gl.uniform1f(u.uSideWidth, side.width);
    gl.uniform1f(u.uSingle, side.single);
    gl.uniform2f(u.uViewport, size.width, size.height);
    gl.uniform1f(u.uTime, (performance.now() - start) * 0.001);
    gl.uniform1f(u.uPulse, pulse * p.pulseStrength);
    gl.uniform1f(u.uReveal, reveal);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const clear = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const delta = now - lastFrame;
    lastFrame = now;
    const rect = section.getBoundingClientRect();
    const nowVisible = rect.bottom > 0 && rect.top < size.height;
    if (!nowVisible) {
      if (visible) clear();
      visible = false;
      return;
    }
    visible = true;
    fluid?.update(now, delta);
    pulse *= p.pulseDecay;
    uploadVideo();
    draw();
  };

  /* --- input --- */
  const onMouseMove = (event: MouseEvent) => {
    if (!fluid) return;
    if (visible) fluid.addMouse(event.clientX, event.clientY, size.width, size.height, performance.now());
    else fluid.resetMouse();
  };

  // Typing in any input sends a burst of splats around it and scrambles the cells.
  const onInput = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target?.matches("input")) return;
    const r = target.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    pulse = 1;
    if (!fluid) return;
    const count = Math.round(p.typeSplats);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      fluid.splats.push({
        x: (cx + Math.cos(a) * p.typeRadius) / size.width,
        y: 1 - (cy + Math.sin(a) * p.typeRadius) / size.height,
        dx: Math.cos(a) * p.typeForce,
        dy: -Math.sin(a) * p.typeForce,
      });
    }
    fluid.lastInput = performance.now();
  };

  /* --- lifecycle --- */
  const viewObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) el.play().catch(() => {});
    else el.pause();
  });
  viewObserver.observe(section);

  // Only fetch the video once the footer is within ~3 screens.
  const nearObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      nearObserver.disconnect();
      el.preload = "auto";
      el.src = videoSrc;
      if (inView) el.play().catch(() => {});
    },
    { rootMargin: "300% 0px" },
  );
  nearObserver.observe(section);

  const layoutObserver = new ResizeObserver(() => setSideCenters());
  layoutObserver.observe(document.body);
  const canvasObserver = new ResizeObserver(resize);
  canvasObserver.observe(canvas);

  const onContextLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(raf);
  };
  canvas.addEventListener("webglcontextlost", onContextLost);
  window.addEventListener("mousemove", onMouseMove);
  document.addEventListener("input", onInput);

  resize();
  clear();
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    viewObserver.disconnect();
    nearObserver.disconnect();
    layoutObserver.disconnect();
    canvasObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", onContextLost);
    window.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("input", onInput);
    if (hasRVFC && rvfc) el.cancelVideoFrameCallback(rvfc);
    el.pause();
    el.removeAttribute("src");
    el.load();
    fluid?.destroy();
    gl.deleteTexture(videoTexture);
    gl.deleteTexture(black);
    gl.deleteProgram(program);
    gl.deleteBuffer(quad.buffer);
    gl.deleteVertexArray(quad.vao);
  };
}
