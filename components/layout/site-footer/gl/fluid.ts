import { FLUID_PARAMS } from "@/constants/footer";
import { createProgram, createTexture, type Program } from "./utils";

/* Stable-fluids simulation (port of the original `fluid` module). Its density
   field is the "energy" texture that lights up footer cells under the cursor. */

const BASE_VERTEX = `
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

const CLEAR = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
void main() { gl_FragColor = value * texture2D(uTexture, vUv); }`;

const SPLAT = `
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

const ADVECTION = `
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

const DIVERGENCE = `
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

const CURL = `
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

const VORTICITY = `
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

const PRESSURE = `
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

const GRADIENT_SUBTRACT = `
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

export interface Splat {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export class FluidSim {
  readonly splats: Splat[] = [];
  lastInput = 0;
  private lastMouse = { x: -1, y: -1 };
  private readonly gl: WebGL2RenderingContext;
  private readonly vao: WebGLVertexArrayObject;
  private readonly texel: [number, number];
  private readonly programs: Record<string, Program>;
  private readonly density: DoubleFBO;
  private readonly velocity: DoubleFBO;
  private readonly pressure: DoubleFBO;
  private readonly curl: FBO;
  private readonly divergence: FBO;
  private readonly owned: { textures: WebGLTexture[]; framebuffers: WebGLFramebuffer[] } = {
    textures: [],
    framebuffers: [],
  };
  private aspect = 1;

  /** Returns null when half-float render targets are unavailable. */
  static create(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject): FluidSim | null {
    if (!gl.getExtension("EXT_color_buffer_float")) return null;
    try {
      return new FluidSim(gl, vao);
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject) {
    this.gl = gl;
    this.vao = vao;
    const { simRes, dyeRes } = FLUID_PARAMS;
    this.texel = [1 / simRes, 1 / simRes];

    const program = (fragment: string, uniforms: string[]) =>
      createProgram(gl, BASE_VERTEX, fragment, ["texelSize", ...uniforms]);
    this.programs = {
      clear: program(CLEAR, ["uTexture", "value"]),
      splat: program(SPLAT, ["uTarget", "aspectRatio", "color", "point", "radius"]),
      advection: program(ADVECTION, ["uVelocity", "uSource", "dt", "dissipation"]),
      divergence: program(DIVERGENCE, ["uVelocity"]),
      curl: program(CURL, ["uVelocity"]),
      vorticity: program(VORTICITY, ["uVelocity", "uCurl", "curl", "dt"]),
      pressure: program(PRESSURE, ["uPressure", "uDivergence"]),
      gradient: program(GRADIENT_SUBTRACT, ["uPressure", "uVelocity"]),
    };

    this.density = this.createDoubleFBO(dyeRes, gl.LINEAR);
    this.velocity = this.createDoubleFBO(simRes, gl.LINEAR);
    this.pressure = this.createDoubleFBO(simRes, gl.NEAREST);
    this.curl = this.createFBO(simRes, gl.NEAREST);
    this.divergence = this.createFBO(simRes, gl.NEAREST);
  }

  /** Current density field (the footer's `uFluid`). */
  get texture(): WebGLTexture {
    return this.density.read.texture;
  }

  setAspect(width: number, height: number): void {
    this.aspect = width / height;
  }

  /** Mouse move in CSS pixels → velocity splat proportional to the cursor delta. */
  addMouse(clientX: number, clientY: number, width: number, height: number, now: number): void {
    const x = clientX / width;
    const y = 1 - clientY / height;
    if (this.lastMouse.x < 0) {
      this.lastMouse = { x, y };
      return;
    }
    const dx = (x - this.lastMouse.x) * FLUID_PARAMS.splatForce;
    const dy = (y - this.lastMouse.y) * FLUID_PARAMS.splatForce;
    this.lastMouse = { x, y };
    if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
      this.splats.push({ x, y, dx, dy });
      this.lastInput = now;
    }
  }

  resetMouse(): void {
    this.lastMouse = { x: -1, y: -1 };
  }

  /** Steps the simulation; returns false once idle (nothing changed). */
  update(now: number, deltaMs: number): boolean {
    if (now - this.lastInput > FLUID_PARAMS.idleMs && this.splats.length === 0) return false;
    this.simulate(Math.min(deltaMs * 0.001, 0.033));
    return true;
  }

  destroy(): void {
    const gl = this.gl;
    this.owned.textures.forEach((t) => gl.deleteTexture(t));
    this.owned.framebuffers.forEach((f) => gl.deleteFramebuffer(f));
    Object.values(this.programs).forEach((p) => gl.deleteProgram(p.program));
  }

  private createFBO(size: number, filter: number): FBO {
    const gl = this.gl;
    const texture = createTexture(gl, filter);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, size, size, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const framebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.viewport(0, 0, size, size);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.owned.textures.push(texture);
    this.owned.framebuffers.push(framebuffer);
    if (!ok) throw new Error("[GL] fluid framebuffer incomplete");
    return { texture, framebuffer, size };
  }

  private createDoubleFBO(size: number, filter: number): DoubleFBO {
    const pair: DoubleFBO = {
      read: this.createFBO(size, filter),
      write: this.createFBO(size, filter),
      swap() {
        const read = pair.read;
        pair.read = pair.write;
        pair.write = read;
      },
    };
    return pair;
  }

  /** Runs one pass into `target`; `textures` are bound to units 0..n in order. */
  private pass(
    name: string,
    target: FBO,
    textures: Record<string, WebGLTexture>,
    set?: (u: Program["uniforms"], gl: WebGL2RenderingContext) => void,
  ): void {
    const gl = this.gl;
    const { program, uniforms } = this.programs[name];
    gl.useProgram(program);
    gl.uniform2f(uniforms.texelSize, this.texel[0], this.texel[1]);
    Object.entries(textures).forEach(([uniform, texture], unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms[uniform], unit);
    });
    set?.(uniforms, gl);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.size, target.size);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private splat({ x, y, dx, dy }: Splat): void {
    const radius = FLUID_PARAMS.radius / 100;
    const common = (u: Program["uniforms"], gl: WebGL2RenderingContext) => {
      gl.uniform1f(u.aspectRatio, this.aspect);
      gl.uniform2f(u.point, x, y);
      gl.uniform1f(u.radius, radius);
    };
    this.pass("splat", this.velocity.write, { uTarget: this.velocity.read.texture }, (u, gl) => {
      common(u, gl);
      gl.uniform3f(u.color, dx, dy, 1);
    });
    this.velocity.swap();
    this.pass("splat", this.density.write, { uTarget: this.density.read.texture }, (u, gl) => {
      common(u, gl);
      gl.uniform3f(u.color, 1, 1, 1);
    });
    this.density.swap();
  }

  private simulate(dt: number): void {
    const gl = this.gl;
    const p = FLUID_PARAMS;
    gl.disable(gl.BLEND);
    gl.bindVertexArray(this.vao);

    for (let i = this.splats.length - 1; i >= 0; i--) this.splat(this.splats.splice(i, 1)[0]);

    this.pass("curl", this.curl, { uVelocity: this.velocity.read.texture });
    this.pass("vorticity", this.velocity.write, { uVelocity: this.velocity.read.texture, uCurl: this.curl.texture }, (u) => {
      gl.uniform1f(u.curl, p.curlStrength);
      gl.uniform1f(u.dt, dt);
    });
    this.velocity.swap();

    this.pass("divergence", this.divergence, { uVelocity: this.velocity.read.texture });

    this.pass("clear", this.pressure.write, { uTexture: this.pressure.read.texture }, (u) =>
      gl.uniform1f(u.value, p.pressureDissipation),
    );
    this.pressure.swap();

    for (let i = 0; i < p.iterations; i++) {
      this.pass("pressure", this.pressure.write, {
        uPressure: this.pressure.read.texture,
        uDivergence: this.divergence.texture,
      });
      this.pressure.swap();
    }

    this.pass("gradient", this.velocity.write, {
      uPressure: this.pressure.read.texture,
      uVelocity: this.velocity.read.texture,
    });
    this.velocity.swap();

    this.pass("advection", this.velocity.write, { uVelocity: this.velocity.read.texture, uSource: this.velocity.read.texture }, (u) => {
      gl.uniform1f(u.dt, dt);
      gl.uniform1f(u.dissipation, p.velocityDissipation);
    });
    this.velocity.swap();

    this.pass("advection", this.density.write, { uVelocity: this.velocity.read.texture, uSource: this.density.read.texture }, (u) => {
      gl.uniform1f(u.dt, dt);
      gl.uniform1f(u.dissipation, p.densityDissipation);
    });
    this.density.swap();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
