/**
 * WebGL2 port of the original "Paper" effect (paper.BdJHLWxu.js on top of OGL).
 *
 * Each plan is painted into a 2D canvas and used as the texture of a finely
 * subdivided plane laid exactly over `[data-pricing-sheet]`. Switching plans
 * curls the top sheet from its top-left corner (cylinder roll + flap), lets a
 * gust lift, spin and blow it off to the right, and reveals the next sheet
 * underneath with a moving contact shadow. Hovering the toggle "peeks" the curl.
 */
import { gsap } from "@/lib/gsap";
import type { PricingPlan } from "@/constants/pricing";

const VERTEX = /* glsl */ `#version 300 es
in vec3 position;
in vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec2 uSize;
uniform vec2 uCorner;
uniform float uFront;
uniform float uRadius;
uniform float uFlap;
uniform float uTension;
uniform float uWave;
uniform float uWaveTime;
uniform float uArc;

out vec2 vUv;
out vec3 vNormal;
out vec3 vPos;

void main()
{
    vUv = uv;

    vec2 p = position.xy * uSize;
    vec2 d = -normalize(uCorner * uSize);
    float half_ = (abs(d.x) * uSize.x + abs(d.y) * uSize.y) * 0.5;
    float f = -half_ + uFront * 2.0 * half_;
    float s = f - dot(p, d);
    float lift = uTension * uRadius * 0.45;
    vec3 o = vec3(p, 0.0);
    vec2 n = vec2(0.0, 1.0);

    if (s <= 0.0)
    {
        if (uTension > 0.0)
        {
            float w = uRadius * 1.6;
            o.z = lift * exp(s / w);
            n = normalize(vec2(o.z / w, 1.0));
        }
    }
    else
    {
        float r = uRadius * (1.0 - 0.35 * uTension);
        float h = r - lift;
        float theta = s / r;
        float a = min(theta, uFlap);
        float run = max(theta - uFlap, 0.0) * r;
        float q = h * sin(a) + run * cos(a);
        o.xy += d * (s - q);
        o.z = r - h * cos(a) + run * sin(a);
        n = vec2(sin(a), cos(a));
    }

    vec3 normal = vec3(d * n.x, n.y);

    if (uWave > 0.0 || uArc > 0.0)
    {
        vec2 wd = vec2(0.819, 0.574);
        float k = 6.2832 / (uSize.x * 0.8);
        float phase = dot(p, wd) * k + uWaveTime;
        float wave = uWave * (sin(phase) + 0.35 * sin(phase * 2.7 + 1.3));
        float dwave = uWave * k * (cos(phase) + 0.945 * cos(phase * 2.7 + 1.3));
        float hx = uSize.x * 0.5;
        float arc = uArc * (1.0 - (p.x * p.x) / (hx * hx));
        float darc = uArc * (-2.0 * p.x) / (hx * hx);
        vec2 grad = wd * dwave + vec2(darc, 0.0);
        float side = normal.z < 0.0 ? -1.0 : 1.0;
        o.z += wave + arc;
        normal = normalize(vec3(-grad, 1.0)) * side;
    }

    vNormal = normalize(mat3(modelMatrix) * normal);

    vec4 world = modelMatrix * vec4(o, 1.0);
    vPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
}`;

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
in vec3 vNormal;
in vec3 vPos;

uniform sampler2D uMap;
uniform vec2 uSize;
uniform vec2 uCorner;
uniform float uCornerRadius;
uniform vec3 uBack;
uniform vec3 uLight;
uniform float uAmbient;
uniform float uWrap;
uniform float uSheen;
uniform float uGrain;
uniform float uAlpha;
uniform float uShadowFront;
uniform float uShadow;
uniform float uShadowWidth;

out vec4 fragColor;

float roundedBox(vec2 p, vec2 b, float r)
{
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main()
{
    vec2 px = (vUv - 0.5) * uSize;
    float sd = roundedBox(px, uSize * 0.5, uCornerRadius);
    float alpha = (1.0 - smoothstep(-0.75, 0.75, sd)) * uAlpha;
    if (alpha <= 0.002) discard;

    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 base = gl_FrontFacing ? texture(uMap, vUv).rgb : uBack;

    vec3 L = normalize(uLight);
    float diff = clamp((dot(n, L) + uWrap) / (1.0 + uWrap), 0.0, 1.0);
    float shade = mix(uAmbient, 1.0, diff);
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(n, H), 0.0), 16.0) * uSheen;
    vec3 col = base * shade + spec;

    if (uShadowFront >= 0.0)
    {
        vec2 d = -normalize(uCorner * uSize);
        float half_ = (abs(d.x) * uSize.x + abs(d.y) * uSize.y) * 0.5;
        float f = -half_ + uShadowFront * 2.0 * half_;
        float behind = f - dot(px, d);
        float sh = uShadow * exp(-max(behind, 0.0) / uShadowWidth) * step(0.0, behind);
        col *= 1.0 - sh;
    }

    col += (hash(floor(px)) - 0.5) * uGrain;

    fragColor = vec4(col * alpha, alpha);
}`;

const DEG = Math.PI / 180;
/** Curl corner (top-left) as a unit direction in plane space. */
const CORNER: [number, number] = [-1, 1];

const PARAMS = {
  segments: 128,
  peekAt: 0.52,
  flapFrom: 180,
  radiusFrom: 64,
  radius: 110,
  radiusGrow: 110,
  radiusLand: 40,
  flap: 180,
  tension: 0,
  duration: 1.25,
  gustFrom: 0.6,
  gustDuration: 1.5,
  windX: 1,
  windLift: 0.45,
  windLiftZ: 140,
  windDepth: 700,
  windSpin: 28,
  windTilt: 26,
  wave: 7,
  waveSpeed: 9,
  arc: 8,
  cornerRadius: 20,
  light: [-0.35, 0.55, 1] as const,
  ambient: 0.7,
  wrap: 0.48,
  sheen: 0.05,
  grain: 0,
  backDarken: 0.04,
  shadow: 0.32,
  shadowWidth: 215,
} as const;

const DESIGN = { w: 535, h: 530 } as const;
/** Touch devices play the flip faster. */
const TOUCH_SPEED = 1.7;
const CAMERA_Z = 1200;

type Vec3 = [number, number, number];
type Quat = [number, number, number, number];

interface CurlState {
  front: number;
  gust: number;
  shade: number;
  flap: number;
  radius: number;
}

const REST: CurlState = { front: 0, gust: 0, shade: 1, flap: 0, radius: 0 };

interface Pose {
  position: Vec3;
  quat: Quat;
}

interface Sheet {
  plan: PricingPlan;
  canvas: HTMLCanvasElement;
  texture: WebGLTexture;
  back: Vec3;
  pose: Pose;
  renderOrder: number;
}

interface Ghost {
  texture: WebGLTexture;
  back: Vec3;
  state: CurlState;
  pose: Pose;
}

const hexToRgb = (hex: string): Vec3 => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** Euler (YXZ order, as OGL) → quaternion. */
function quatFromEuler(x: number, y: number, z: number): Quat {
  const sx = Math.sin(x * 0.5);
  const cx = Math.cos(x * 0.5);
  const sy = Math.sin(y * 0.5);
  const cy = Math.cos(y * 0.5);
  const sz = Math.sin(z * 0.5);
  const cz = Math.cos(z * 0.5);
  return [sx * cy * cz + cx * sy * sz, cx * sy * cz - sx * cy * sz, cx * cy * sz - sx * sy * cz, cx * cy * cz + sx * sy * sz];
}

function applyQuat([x, y, z]: Vec3, [qx, qy, qz, qw]: Quat): Vec3 {
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  return [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx,
  ];
}

function modelMatrix({ position: [tx, ty, tz], quat: [x, y, z, w] }: Pose, out: Float32Array) {
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;
  out.set([
    1 - (yy + zz), xy + wz, xz - wy, 0,
    xy - wz, 1 - (xx + zz), yz + wx, 0,
    xz + wy, yz - wx, 1 - (xx + yy), 0,
    tx, ty, tz, 1,
  ]);
  return out;
}

function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

/** Paints one plan card (port of the original canvas layout, design units × `scale`). */
function paintSheet(canvas: HTMLCanvasElement, width: number, height: number, scale: number, plan: PricingPlan, family: string) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = plan.color;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#000";
  ctx.textBaseline = "alphabetic";
  const font = (size: number, weight: number) => {
    ctx.font = `${weight} ${size * scale}px ${family}`;
    ctx.letterSpacing = `${-0.02 * size * scale}px`;
  };
  const metrics = (size: number): [number, number] => {
    const m = ctx.measureText("Hg");
    return [m.fontBoundingBoxAscent ?? size * scale * 0.95, m.fontBoundingBoxDescent ?? size * scale * 0.25];
  };
  /** Baseline offset from a line box top. */
  const fromTop = (size: number, lineHeight: number) => {
    const [asc, desc] = metrics(size);
    return (lineHeight * size * scale - asc - desc) / 2 + asc;
  };
  /** Baseline offset from a line box bottom. */
  const fromBottom = (size: number, lineHeight: number) => {
    const [asc, desc] = metrics(size);
    return (asc - desc - lineHeight * size * scale) / 2;
  };
  const pad = 40 * scale;

  font(28, 600);
  ctx.textAlign = "left";
  ctx.fillText(plan.title, pad, pad + fromTop(28, 1.3));

  if (plan.note) {
    const noteY = height - 44 * scale;
    font(28, 600);
    ctx.textAlign = "right";
    ctx.globalAlpha = 0.3;
    ctx.fillText(plan.note, pad + 362 * scale, noteY + fromBottom(28, 0.9));
    ctx.globalAlpha = 1;
    const amountY = height - 32 * scale - 49.2 * scale + 10 * scale;
    font(164, 500);
    ctx.textAlign = "left";
    ctx.fillText(plan.amount, pad, amountY + fromBottom(164, 0.9));
    font(28, 600);
    ctx.textAlign = "right";
    ctx.fillText(plan.period, pad + 363 * scale, amountY - 12 * scale + fromBottom(28, 0.9));
    return;
  }

  const bottom = height - pad;
  font(164, 500);
  ctx.textAlign = "left";
  const amountWidth = ctx.measureText(plan.amount).width;
  ctx.fillText(plan.amount, pad, bottom + fromBottom(164, 0.9));
  font(28, 600);
  ctx.fillText(plan.period, pad + amountWidth + 4 * scale, bottom - 12 * scale + fromBottom(28, 0.9));
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
  }
  return shader;
}

export interface PaperCurlOptions {
  section: HTMLElement;
  sheet: HTMLElement;
  canvas: HTMLCanvasElement;
  plans: readonly PricingPlan[];
  /** Touch layout: canvas sized to the section instead of the viewport. */
  inflow: boolean;
}

export class PaperCurl {
  private readonly section: HTMLElement;
  private readonly target: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly plans: readonly PricingPlan[];
  private readonly inflow: boolean;
  private readonly speed: number;
  private readonly family: string;
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly buffers: WebGLBuffer[] = [];
  private readonly indexBuffer: WebGLBuffer;
  private readonly indices: Uint16Array;
  private readonly positions: Float32Array;
  private readonly uniforms: Record<string, WebGLUniformLocation | null> = {};
  private readonly sheets: Sheet[];
  private readonly ghosts = new Set<Ghost>();
  private readonly state: CurlState = { ...REST, flap: PARAMS.flapFrom * DEG, radius: PARAMS.radiusFrom };
  private readonly head = { t: 0 };
  private readonly matrix = new Float32Array(16);
  private readonly startTime = performance.now();
  private tl: gsap.core.Timeline;
  private top = 0;
  private heading: number | null = null;
  private playing = false;
  private shown = false;
  private near = false;
  private dpr: number;
  private stage = { w: 0, h: 0 };
  private projection = new Float32Array(16);
  private rect: DOMRect | null = null;
  private origin = { left: 0, top: 0 };
  private rendered = { w: 0, h: 0 };
  private sortedFor = "";
  private version = 0;
  private lastSignature = "";
  private renderedAt = 0;
  private destroyed = false;
  private readonly layoutObserver: ResizeObserver;
  private readonly visibilityObserver: IntersectionObserver;
  private readonly tick = () => this.update();
  private readonly onResize = () => this.resize();

  /** Returns `null` when WebGL2 is unavailable (the DOM fallback stays visible). */
  static create(options: PaperCurlOptions): PaperCurl | null {
    try {
      return new PaperCurl(options);
    } catch (error) {
      console.warn("[Paper] no WebGL context:", (error as Error).message);
      return null;
    }
  }

  private constructor({ section, sheet, canvas, plans, inflow }: PaperCurlOptions) {
    this.section = section;
    this.target = sheet;
    this.canvas = canvas;
    this.plans = plans;
    this.inflow = inflow;
    this.speed = inflow ? TOUCH_SPEED : 1;
    this.family = getComputedStyle(sheet).fontFamily || "sans-serif";
    this.dpr = inflow ? Math.min(window.devicePixelRatio || 1, 3) : Math.min(window.devicePixelRatio || 1, 2);

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
    });
    if (!gl) throw new Error("WebGL2 unsupported");
    this.gl = gl;
    gl.clearColor(0, 0, 0, 0);

    // Program
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "program link failed");
    }
    this.program = program;
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) this.uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }

    // Geometry: unit plane subdivided `segments` times (OGL Plane layout).
    const segs = PARAMS.segments;
    const verts = (segs + 1) * (segs + 1);
    this.positions = new Float32Array(verts * 3);
    const uvs = new Float32Array(verts * 2);
    for (let iy = 0, v = 0; iy <= segs; iy++) {
      for (let ix = 0; ix <= segs; ix++, v++) {
        this.positions[v * 3] = ix / segs - 0.5;
        this.positions[v * 3 + 1] = -(iy / segs - 0.5);
        uvs[v * 2] = ix / segs;
        uvs[v * 2 + 1] = 1 - iy / segs;
      }
    }
    this.indices = new Uint16Array(segs * segs * 6);
    for (let iy = 0, k = 0; iy < segs; iy++) {
      for (let ix = 0; ix < segs; ix++) {
        const a = ix + iy * (segs + 1);
        const b = ix + (iy + 1) * (segs + 1);
        this.indices.set([a, b, a + 1, b, b + 1, a + 1], k);
        k += 6;
      }
    }
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    const attribute = (name: string, data: Float32Array, size: number) => {
      const location = gl.getAttribLocation(program, name);
      const buffer = gl.createBuffer()!;
      this.buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      if (location < 0) return;
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    };
    attribute("position", this.positions, 3);
    attribute("uv", uvs, 2);
    this.indexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.DYNAMIC_DRAW);
    gl.bindVertexArray(null);

    // Static uniforms
    gl.useProgram(program);
    gl.uniform2f(this.uniforms.uCorner, CORNER[0], CORNER[1]);
    gl.uniform3f(this.uniforms.uLight, ...PARAMS.light);
    gl.uniform1f(this.uniforms.uAmbient, PARAMS.ambient);
    gl.uniform1f(this.uniforms.uWrap, PARAMS.wrap);
    gl.uniform1f(this.uniforms.uSheen, PARAMS.sheen);
    gl.uniform1f(this.uniforms.uGrain, PARAMS.grain);
    gl.uniform1f(this.uniforms.uAlpha, 1);
    gl.uniform1f(this.uniforms.uTension, PARAMS.tension);
    gl.uniform1i(this.uniforms.uMap, 0);
    gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -CAMERA_Z, 1]));

    this.sheets = plans.map((plan, i) => ({
      plan,
      canvas: document.createElement("canvas"),
      texture: gl.createTexture()!,
      back: [0, 0, 0],
      pose: { position: [0, 0, 0], quat: [0, 0, 0, 1] },
      renderOrder: i === this.top ? 6 : 5,
    }));

    this.fitStage(true);
    this.updateRects();
    this.sortIndices();
    this.renderCards(true);
    this.tl = this.buildTimeline();

    this.layoutObserver = new ResizeObserver(() => {
      this.updateRects();
      this.fitStage();
      this.renderCards();
      this.sortIndices();
    });
    this.layoutObserver.observe(document.body);
    window.addEventListener("resize", this.onResize);

    // Only tick while the section is within about a viewport of the screen.
    this.visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        this.near = entry.isIntersecting;
        this.syncTicker();
      },
      { rootMargin: "100% 0px" },
    );
    this.visibilityObserver.observe(section);

    Promise.all([document.fonts?.load(`600 48px ${this.family}`), document.fonts?.ready])
      .then(() => !this.destroyed && this.renderCards(true))
      .catch(() => null);
  }

  // ---------------------------------------------------------------- layout

  private get view() {
    return this.inflow
      ? { w: this.section.clientWidth, h: this.section.clientHeight }
      : { w: window.innerWidth, h: window.innerHeight };
  }

  private get scale() {
    return (this.rect?.width || DESIGN.w) / DESIGN.w;
  }

  private fitStage(force = false) {
    const { w, h } = this.view;
    if (!force && w === this.stage.w && h === this.stage.h) return;
    this.stage = { w, h };
    this.canvas.width = Math.max(1, Math.round(w * this.dpr));
    this.canvas.height = Math.max(1, Math.round(h * this.dpr));
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    const fov = Math.atan(h / 2 / CAMERA_Z) * 2;
    this.projection = perspective(fov, w / Math.max(h, 1), 1, 3000);
    this.lastSignature = "";
  }

  private updateRects() {
    this.rect = this.target.getBoundingClientRect();
    this.origin = this.inflow ? this.section.getBoundingClientRect() : { left: 0, top: 0 };
  }

  /** Back-to-front triangle order so the curling corner draws over the flat part (no depth buffer). */
  private sortIndices() {
    const w = this.rect?.width || DESIGN.w;
    const h = this.rect?.height || DESIGN.h;
    const key = `${w.toFixed(1)}x${h.toFixed(1)}`;
    if (key === this.sortedFor) return;
    this.sortedFor = key;
    const [cx, cy] = CORNER;
    const kx = -cx * w;
    const ky = -cy * h;
    const p = this.positions;
    const idx = this.indices;
    const tris: [number, number, number, number][] = [];
    for (let n = 0; n < idx.length; n += 3) {
      const a = idx[n];
      const b = idx[n + 1];
      const c = idx[n + 2];
      const sx = p[a * 3] + p[b * 3] + p[c * 3];
      const sy = p[a * 3 + 1] + p[b * 3 + 1] + p[c * 3 + 1];
      tris.push([sx * kx + sy * ky, a, b, c]);
    }
    tris.sort((m, n) => n[0] - m[0]);
    tris.forEach(([, a, b, c], n) => idx.set([a, b, c], n * 3));
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, idx);
    gl.bindVertexArray(null);
    this.touch();
  }

  private renderCards(force = false) {
    if (!this.rect) return;
    const w = Math.max(1, Math.round(this.rect.width * this.dpr));
    const h = Math.max(1, Math.round(this.rect.height * this.dpr));
    if (!force && w === this.rendered.w && h === this.rendered.h) return;
    this.rendered = { w, h };
    const gl = this.gl;
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    const darken = 1 - PARAMS.backDarken;
    for (const sheet of this.sheets) {
      paintSheet(sheet.canvas, w, h, this.scale * this.dpr, sheet.plan, this.family);
      gl.bindTexture(gl.TEXTURE_2D, sheet.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sheet.canvas);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
      const [r, g, b] = hexToRgb(sheet.plan.color);
      sheet.back = [r * darken, g * darken, b * darken];
    }
    this.touch();
  }

  private resize() {
    this.updateRects();
    this.fitStage();
    this.renderCards();
    this.sortIndices();
    this.lastSignature = "";
  }

  // ---------------------------------------------------------------- animation

  private buildTimeline() {
    const p = PARAMS;
    const t = this.state;
    Object.assign(t, REST, { flap: p.flapFrom * DEG, radius: p.radiusFrom });
    return gsap
      .timeline({ paused: true })
      .fromTo(t, { front: 0 }, { front: 1, duration: p.duration, ease: "power2.inOut" }, 0)
      .fromTo(
        t,
        { flap: p.flapFrom * DEG, radius: p.radiusFrom },
        { flap: p.flap * DEG, radius: p.radius + p.radiusGrow, duration: p.duration * 0.4, ease: "power2.out" },
        0,
      )
      .to(t, { radius: p.radiusLand, duration: p.duration * 0.3, ease: "power2.inOut" }, p.duration * 0.4)
      .fromTo(t, { shade: 1 }, { shade: 0, duration: p.duration * 0.15, ease: "power1.inOut" }, p.duration * 0.45)
      .fromTo(t, { gust: 0 }, { gust: 1, duration: p.gustDuration, ease: "none" }, p.duration * p.gustFrom);
  }

  private rebuild(keepProgress = false) {
    const progress = keepProgress ? this.head.t / this.tl.duration() : 0;
    gsap.killTweensOf(this.head);
    this.tl.kill();
    this.tl = this.buildTimeline();
    this.head.t = progress * this.tl.duration();
    this.tl.time(this.head.t);
  }

  private drive(to: number, duration: number, ease: string, onComplete?: () => void) {
    gsap.killTweensOf(this.head);
    gsap.to(this.head, {
      t: to,
      duration,
      ease,
      onUpdate: () => {
        this.tl.time(this.head.t);
        this.touch();
      },
      onComplete,
    });
    this.syncTicker();
  }

  /** Lift the corner a little while the toggle is hovered. */
  peek(on: boolean) {
    if (this.playing) return;
    const p = PARAMS;
    this.drive(on ? p.peekAt * p.duration : 0, on ? 0.7 : 0.55, on ? "power3.out" : "power2.inOut");
  }

  /** Flip to sheet `index` (0 = monthly, 1 = yearly). */
  flip(index: number) {
    if (this.playing) {
      if (this.heading === index) return;
      if (this.state.gust > 0) {
        this.detach();
        this.settle(this.heading ?? index);
        this.flip(index);
        return;
      }
      this.heading = this.top;
      this.drive(0, this.head.t / this.speed, "none", () => this.settle(this.top));
      return;
    }
    if (index === this.top) return;
    const total = this.tl.duration();
    this.playing = true;
    this.heading = index;
    this.drive(total, (total - this.head.t) / this.speed, "none", () => this.settle(index));
  }

  private settle(index: number) {
    this.top = index;
    this.heading = null;
    this.playing = false;
    this.rebuild();
    this.sheets.forEach((sheet, i) => (sheet.renderOrder = i === index ? 6 : 5));
    this.touch();
  }

  /** Hands the flying sheet to a "ghost" so a new flip can start immediately. */
  private detach() {
    const sheet = this.sheets[this.top];
    const t = this.state;
    const ghost: Ghost = {
      texture: sheet.texture,
      back: sheet.back,
      state: { front: t.front, flap: t.flap, radius: t.radius, gust: t.gust, shade: 0 },
      pose: { position: [0, 0, 0], quat: [0, 0, 0, 1] },
    };
    this.ghosts.add(ghost);
    const duration = Math.max(0.05, (PARAMS.gustDuration * (1 - t.gust)) / this.speed);
    gsap.to(ghost.state, { gust: 1, duration, ease: "none" });
    gsap.to(ghost.state, { front: 1, radius: PARAMS.radiusLand, duration: Math.min(duration, 0.5), ease: "power1.out" });
    gsap.delayedCall(duration, () => this.release(ghost));
    this.syncTicker();
  }

  private release(ghost: Ghost) {
    gsap.killTweensOf(ghost.state);
    this.ghosts.delete(ghost);
    this.touch();
  }

  private touch() {
    this.version++;
  }

  // ---------------------------------------------------------------- frame

  private get busy() {
    return gsap.isTweening(this.head) || this.ghosts.size > 0 || this.state.gust > 0;
  }

  private ticking = false;
  private syncTicker() {
    const want = !this.destroyed && (this.near || this.busy);
    if (want && !this.ticking) gsap.ticker.add(this.tick);
    else if (!want && this.ticking) gsap.ticker.remove(this.tick);
    this.ticking = want;
  }

  private pose(target: Pose, state: CurlState, x: number, y: number, rect: DOMRect) {
    if (state.gust <= 0) {
      target.position = [x, y, 0];
      target.quat = [0, 0, 0, 1];
      return;
    }
    const p = PARAMS;
    const [ox, oy] = CORNER;
    const c = state.gust;
    const sq = c * c;
    const out = 1 - (1 - c) * (1 - c);
    const quat = quatFromEuler(
      p.windTilt * 0.5 * DEG * Math.sin(c * Math.PI * 2.2 + 0.8),
      p.windTilt * DEG * Math.sin(c * Math.PI * 1.5),
      p.windSpin * DEG * out,
    );
    const pivot = applyQuat([-ox * rect.width, -oy * rect.height, 0], quat);
    target.quat = quat;
    target.position = [
      x - ox * rect.width - pivot[0] + sq * p.windX * (this.stage.w + rect.width),
      y - oy * rect.height - pivot[1] + out * p.windLift * rect.height,
      -pivot[2] + p.windLiftZ * this.scale * Math.sin(Math.PI * c) - p.windDepth * c * c,
    ];
  }

  private update() {
    if (this.destroyed) return;
    this.updateRects();
    const rect = this.rect;
    if (!rect) return;
    const vh = window.innerHeight;
    const onScreen = rect.bottom > -vh && rect.top < vh + vh;
    const x = rect.left - this.origin.left + rect.width / 2 - this.stage.w / 2;
    const y = this.stage.h / 2 - (rect.top - this.origin.top + rect.height / 2);
    const show = onScreen || this.state.gust > 0 || this.ghosts.size > 0;
    if (show !== this.shown) {
      this.shown = show;
      this.lastSignature = "";
      if (!show) this.clear();
    }
    this.sheets.forEach((sheet, i) => this.pose(sheet.pose, i === this.top ? this.state : REST, x, y, rect));
    for (const ghost of this.ghosts) this.pose(ghost.pose, ghost.state, x, y, rect);
    if (this.shown) this.render(x, y, rect);
    this.syncTicker();
  }

  private clear() {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  private render(x: number, y: number, rect: DOMRect) {
    const t = this.state;
    const signature = [this.version, this.top, t.front, t.flap, t.radius, t.gust, t.shade, x, y, rect.width, rect.height].join();
    const now = performance.now();
    if (!this.busy && signature === this.lastSignature && now - this.renderedAt < 1000) return;
    this.lastSignature = signature;
    this.renderedAt = now;

    const gl = this.gl;
    const u = this.uniforms;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.uniformMatrix4fv(u.projectionMatrix, false, this.projection);
    gl.uniform2f(u.uSize, rect.width, rect.height);
    gl.activeTexture(gl.TEXTURE0);

    const elapsed = (now - this.startTime) / 1000;
    const draw = (
      texture: WebGLTexture,
      back: Vec3,
      pose: Pose,
      state: CurlState,
      front: number,
      gust: number,
      shadowFront: number,
      shadow: number,
    ) => {
      const scale = this.scale;
      const wind = Math.min(1, gust * 3) * (1 - 0.3 * gust);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform3f(u.uBack, ...back);
      gl.uniform1f(u.uFront, front);
      gl.uniform1f(u.uFlap, state.flap);
      gl.uniform1f(u.uRadius, state.radius * scale);
      gl.uniform1f(u.uWave, PARAMS.wave * scale * wind);
      gl.uniform1f(u.uWaveTime, elapsed * PARAMS.waveSpeed);
      gl.uniform1f(u.uArc, PARAMS.arc * scale * wind);
      gl.uniform1f(u.uCornerRadius, PARAMS.cornerRadius * scale);
      gl.uniform1f(u.uShadowWidth, PARAMS.shadowWidth * scale);
      gl.uniform1f(u.uShadow, shadow);
      gl.uniform1f(u.uShadowFront, shadowFront);
      gl.uniformMatrix4fv(u.modelMatrix, false, modelMatrix(pose, this.matrix));
      gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    };

    // Lower render order first: sheet underneath, then the top sheet, then ghosts.
    [...this.sheets]
      .sort((a, b) => a.renderOrder - b.renderOrder)
      .forEach((sheet) => {
        const isTop = sheet === this.sheets[this.top];
        if (isTop) draw(sheet.texture, sheet.back, sheet.pose, t, t.front, t.gust, -1, 0);
        else draw(sheet.texture, sheet.back, sheet.pose, t, 0, 0, t.front > 0 ? t.front : -1, PARAMS.shadow * t.shade);
      });
    for (const ghost of this.ghosts) {
      draw(ghost.texture, ghost.back, ghost.pose, ghost.state, ghost.state.front, ghost.state.gust, -1, 0);
    }
    gl.bindVertexArray(null);
  }

  destroy() {
    this.destroyed = true;
    gsap.ticker.remove(this.tick);
    this.ticking = false;
    this.layoutObserver.disconnect();
    this.visibilityObserver.disconnect();
    window.removeEventListener("resize", this.onResize);
    gsap.killTweensOf(this.head);
    this.ghosts.forEach((ghost) => this.release(ghost));
    this.tl.kill();
    const gl = this.gl;
    this.clear();
    this.sheets.forEach((sheet) => gl.deleteTexture(sheet.texture));
    this.buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    gl.deleteBuffer(this.indexBuffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
    this.canvas.style.removeProperty("width");
    this.canvas.style.removeProperty("height");
  }
}
