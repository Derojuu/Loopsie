import { HERO_FLUID, HERO_GRID_GL } from "@/constants/hero";
import type { HeroGridState } from "@/components/sections/hero/heroShapesController";

/*
 * Raw WebGL2 port of the original OGL `grid` + `fluid` modules: a full-screen
 * 34px line grid (coral, 15% alpha) whose lines thicken and brighten where a
 * small Navier–Stokes dye simulation, fed by the mouse, leaves a trail.
 */

const QUAD_VERT = `
attribute vec2 position;
uniform vec2 texelSize;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
void main() {
  vUv = position * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const CLEAR_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
void main() { gl_FragColor = value * texture2D(uTexture, vUv); }`;

const SPLAT_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main() {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  vec3 splat = pow(2.0, -dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}`;

const ADVECTION_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main() {
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
  gl_FragColor = dissipation * texture2D(uSource, coord);
  gl_FragColor.a = 1.0;
}`;

const DIVERGENCE_FRAG = `
precision highp float;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
void main() {
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  float div = 0.6 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

const CURL_FRAG = `
precision highp float;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
void main() {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.05 * vorticity, 0.0, 0.0, 1.0);
}`;

const VORTICITY_FRAG = `
precision highp float;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main() {
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture2D(uVelocity, vUv).xy;
  gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
}`;

const PRESSURE_FRAG = `
precision highp float;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float divergence = texture2D(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

const GRADIENT_FRAG = `
precision highp float;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`;

const GRID_VERT = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

/** The original grid fragment shader, minus the (unused here) line-reveal transitions. */
const GRID_FRAG = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform sampler2D uTrail;
uniform float uCellSize;
uniform float uScroll;
uniform float uThickness;
uniform float uThicknessBoost;
uniform vec3 uColor;
uniform vec3 uColorHot;
uniform float uBaseAlpha;
uniform float uHotAlpha;
uniform vec4 uClip; // left, right, top, bottom
in vec2 vUv;
out vec4 fragColor;

float maskAt(vec2 px) {
  vec2 lo = vec2(uClip.x, uClip.w);
  vec2 hi = uResolution - vec2(uClip.y, uClip.z);
  vec2 inside = step(lo, px) * step(px, hi);
  return inside.x * inside.y;
}

void main() {
  vec2 px = vUv * uResolution;
  vec2 cell = vec2(px.x, px.y - uScroll) / uCellSize;
  vec2 deriv = fwidth(cell);
  float m = maskAt(px);
  if (m < 0.001) discard;
  float spot = clamp(texture(uTrail, vUv).r, 0.0, 1.0);
  vec2 gridDist = abs(fract(cell - 0.5) - 0.5) / max(deriv, vec2(1e-5));
  float thickness = uThickness + spot * uThicknessBoost;
  float coverV = 1.0 - smoothstep(0.0, 1.0, gridDist.x - (thickness - 1.0));
  float coverH = 1.0 - smoothstep(0.0, 1.0, gridDist.y - (thickness - 1.0));
  float coverage = max(coverV, coverH);
  float alpha = mix(uBaseAlpha, uHotAlpha, spot) * coverage * m;
  if (alpha < 0.001) discard;
  vec3 color = mix(uColor, uColorHot, spot);
  fragColor = vec4(color * alpha, alpha);
}`;

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

class Program {
  readonly program: WebGLProgram;
  private readonly locations = new Map<string, WebGLUniformLocation | null>();

  constructor(
    private readonly gl: WebGL2RenderingContext,
    vertex: string,
    fragment: string,
  ) {
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source.trim());
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
      }
      return shader;
    };
    const program = gl.createProgram()!;
    const vs = compile(gl.VERTEX_SHADER, vertex);
    const fs = compile(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "position");
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "program link failed");
    }
    this.program = program;
  }

  private loc(name: string) {
    if (!this.locations.has(name)) this.locations.set(name, this.gl.getUniformLocation(this.program, name));
    return this.locations.get(name)!;
  }

  use(): this {
    this.gl.useProgram(this.program);
    return this;
  }

  f(name: string, ...v: number[]): this {
    const l = this.loc(name);
    if (v.length === 1) this.gl.uniform1f(l, v[0]);
    else if (v.length === 2) this.gl.uniform2f(l, v[0], v[1]);
    else if (v.length === 3) this.gl.uniform3f(l, v[0], v[1], v[2]);
    else this.gl.uniform4f(l, v[0], v[1], v[2], v[3]);
    return this;
  }

  tex(name: string, unit: number, texture: WebGLTexture): this {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.uniform1i(this.loc(name), unit);
    return this;
  }

  destroy(): void {
    this.gl.deleteProgram(this.program);
  }
}

interface FBO {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  size: number;
}

interface DoubleFBO {
  read: FBO;
  write: FBO;
  swap: () => void;
}

interface Splat {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

class Fluid {
  private readonly texel: number;
  private readonly density: DoubleFBO;
  private readonly velocity: DoubleFBO;
  private readonly pressure: DoubleFBO;
  private readonly curl: FBO;
  private readonly divergence: FBO;
  private readonly programs: Record<
    "clear" | "splat" | "advection" | "divergence" | "curl" | "vorticity" | "pressure" | "gradient",
    Program
  >;
  private readonly fbos: FBO[] = [];
  private splats: Splat[] = [];
  private lastMouse = { x: -1, y: -1 };
  private lastInput = -Infinity;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly draw: () => void,
  ) {
    const { simRes, dyeRes } = HERO_FLUID;
    this.texel = 1 / simRes;
    this.density = this.createDouble(dyeRes, gl.LINEAR);
    this.velocity = this.createDouble(simRes, gl.LINEAR);
    this.pressure = this.createDouble(simRes, gl.NEAREST);
    this.curl = this.createFBO(simRes, gl.NEAREST);
    this.divergence = this.createFBO(simRes, gl.NEAREST);
    this.programs = {
      clear: new Program(gl, QUAD_VERT, CLEAR_FRAG),
      splat: new Program(gl, QUAD_VERT, SPLAT_FRAG),
      advection: new Program(gl, QUAD_VERT, ADVECTION_FRAG),
      divergence: new Program(gl, QUAD_VERT, DIVERGENCE_FRAG),
      curl: new Program(gl, QUAD_VERT, CURL_FRAG),
      vorticity: new Program(gl, QUAD_VERT, VORTICITY_FRAG),
      pressure: new Program(gl, QUAD_VERT, PRESSURE_FRAG),
      gradient: new Program(gl, QUAD_VERT, GRADIENT_FRAG),
    };
  }

  get texture(): WebGLTexture {
    return this.density.read.texture;
  }

  private createFBO(size: number, filter: number): FBO {
    const { gl } = this;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, size, size, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const framebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      throw new Error("half-float render target unsupported");
    }
    gl.viewport(0, 0, size, size);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const fbo = { texture, framebuffer, size };
    this.fbos.push(fbo);
    return fbo;
  }

  private createDouble(size: number, filter: number): DoubleFBO {
    const pair: DoubleFBO = {
      read: this.createFBO(size, filter),
      write: this.createFBO(size, filter),
      swap() {
        const read = this.read;
        this.read = this.write;
        this.write = read;
      },
    };
    return pair;
  }

  private pass(program: Program, target: FBO): void {
    const { gl } = this;
    program.f("texelSize", this.texel, this.texel);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.size, target.size);
    this.draw();
  }

  pointer(clientX: number, clientY: number, width: number, height: number, now: number): void {
    const x = clientX / width;
    const y = 1 - clientY / height;
    if (this.lastMouse.x < 0) {
      this.lastMouse = { x, y };
      return;
    }
    const dx = (x - this.lastMouse.x) * HERO_FLUID.splatForce;
    const dy = (y - this.lastMouse.y) * HERO_FLUID.splatForce;
    this.lastMouse = { x, y };
    if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
      this.splats.push({ x, y, dx, dy });
      this.lastInput = now;
    }
  }

  resetPointer(): void {
    this.lastMouse = { x: -1, y: -1 };
  }

  /** Steps the simulation. Returns false (and does nothing) once idle. */
  update(now: number, deltaMs: number, aspect: number): boolean {
    if (now - this.lastInput > HERO_FLUID.idleMs && this.splats.length === 0) return false;
    const dt = Math.min(deltaMs * 0.001, 0.033);
    const p = this.programs;
    const { velocity, density, pressure } = this;

    for (let i = this.splats.length - 1; i >= 0; i--) {
      const s = this.splats.splice(i, 1)[0];
      p.splat.use().f("aspectRatio", aspect).f("point", s.x, s.y).f("radius", HERO_FLUID.radius / 100);
      p.splat.f("color", s.dx, s.dy, 1).tex("uTarget", 0, velocity.read.texture);
      this.pass(p.splat, velocity.write);
      velocity.swap();
      p.splat.f("color", 1, 1, 1).tex("uTarget", 0, density.read.texture);
      this.pass(p.splat, density.write);
      density.swap();
    }

    p.curl.use().tex("uVelocity", 0, velocity.read.texture);
    this.pass(p.curl, this.curl);

    p.vorticity
      .use()
      .tex("uVelocity", 0, velocity.read.texture)
      .tex("uCurl", 1, this.curl.texture)
      .f("curl", HERO_FLUID.curlStrength)
      .f("dt", dt);
    this.pass(p.vorticity, velocity.write);
    velocity.swap();

    p.divergence.use().tex("uVelocity", 0, velocity.read.texture);
    this.pass(p.divergence, this.divergence);

    p.clear.use().tex("uTexture", 0, pressure.read.texture).f("value", HERO_FLUID.pressureDissipation);
    this.pass(p.clear, pressure.write);
    pressure.swap();

    p.pressure.use().tex("uDivergence", 1, this.divergence.texture);
    for (let i = 0; i < HERO_FLUID.iterations; i++) {
      p.pressure.tex("uPressure", 0, pressure.read.texture);
      this.pass(p.pressure, pressure.write);
      pressure.swap();
    }

    p.gradient.use().tex("uPressure", 0, pressure.read.texture).tex("uVelocity", 1, velocity.read.texture);
    this.pass(p.gradient, velocity.write);
    velocity.swap();

    p.advection
      .use()
      .f("dt", dt)
      .tex("uVelocity", 0, velocity.read.texture)
      .tex("uSource", 1, velocity.read.texture)
      .f("dissipation", HERO_FLUID.velocityDissipation);
    this.pass(p.advection, velocity.write);
    velocity.swap();

    p.advection
      .tex("uVelocity", 0, velocity.read.texture)
      .tex("uSource", 1, density.read.texture)
      .f("dissipation", HERO_FLUID.densityDissipation);
    this.pass(p.advection, density.write);
    density.swap();

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    return true;
  }

  destroy(): void {
    Object.values(this.programs).forEach((program) => program.destroy());
    this.fbos.forEach((fbo) => {
      this.gl.deleteTexture(fbo.texture);
      this.gl.deleteFramebuffer(fbo.framebuffer);
    });
  }
}

export class HeroGridRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly quad: WebGLBuffer;
  private readonly vao: WebGLVertexArrayObject;
  private readonly grid: Program;
  private readonly black: WebGLTexture;
  private fluid: Fluid | null = null;
  private readonly colors = { base: hexToRgb(HERO_GRID_GL.color), hot: hexToRgb(HERO_GRID_GL.colorHot) };
  private width = 1;
  private height = 1;
  private dpr = 1;
  private signature = "";
  private lastTime = performance.now();
  private cleared = true;

  /** Throws if WebGL2 is unavailable. */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly state: HeroGridState,
    withFluid: boolean,
  ) {
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    gl.clearColor(0, 0, 0, 0);

    this.quad = gl.createBuffer()!;
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.grid = new Program(gl, GRID_VERT, GRID_FRAG);
    this.black = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.black);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

    if (withFluid && gl.getExtension("EXT_color_buffer_float")) {
      try {
        this.fluid = new Fluid(gl, () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4));
      } catch {
        this.fluid = null;
      }
    }
    this.resize();
  }

  resize(): void {
    this.width = this.canvas.clientWidth || window.innerWidth;
    this.height = this.canvas.clientHeight || window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, HERO_GRID_GL.maxDpr);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.signature = "";
  }

  pointer(e: MouseEvent): void {
    if (!this.state.ready) {
      this.fluid?.resetPointer();
      return;
    }
    this.fluid?.pointer(e.clientX, e.clientY, this.width, this.height, performance.now());
  }

  /** Called every frame while the hero / intro is on screen. */
  render(): void {
    const { gl, state } = this;
    const now = performance.now();
    const delta = Math.min(now - this.lastTime, 100);
    this.lastTime = now;

    if (!state.ready) {
      if (!this.cleared) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.cleared = true;
        this.signature = "";
      }
      return;
    }

    gl.bindVertexArray(this.vao);
    const simulated = this.fluid?.update(now, delta, this.width / this.height) ?? false;
    const scroll = state.scrollLocked ? state.lockedScroll : window.scrollY;
    const { left, right, top, bottom } = state.clip;
    const signature = `${this.width}|${this.height}|${scroll}|${left}|${right}|${top}|${bottom}`;
    if (!simulated && signature === this.signature) return;
    this.signature = signature;
    this.cleared = false;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.grid
      .use()
      .f("uResolution", this.width, this.height)
      .f("uCellSize", HERO_GRID_GL.cellSize)
      .f("uScroll", scroll)
      .f("uThickness", HERO_GRID_GL.thickness)
      .f("uThicknessBoost", HERO_GRID_GL.thicknessBoost)
      .f("uColor", ...this.colors.base)
      .f("uColorHot", ...this.colors.hot)
      .f("uBaseAlpha", HERO_GRID_GL.baseAlpha)
      .f("uHotAlpha", HERO_GRID_GL.hotAlpha)
      .f("uClip", left, right, top, bottom)
      .tex("uTrail", 0, this.fluid?.texture ?? this.black);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
  }

  /** Clears the canvas (used when the layer scrolls out of view). */
  clear(): void {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.cleared = true;
    this.signature = "";
  }

  destroy(): void {
    const { gl } = this;
    this.fluid?.destroy();
    this.grid.destroy();
    gl.deleteTexture(this.black);
    gl.deleteBuffer(this.quad);
    gl.deleteVertexArray(this.vao);
  }
}
