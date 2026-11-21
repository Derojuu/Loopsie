import {
  CLOCK_PALETTE,
  CLOCK_PARAMS,
  CLOCK_SHAPES,
  CLOCK_SHAPE_WEIGHTS,
  type ClockShape,
} from "@/constants/waitlist";

export interface SimHand {
  angle: number;
  /** Angular velocity (rad/s). */
  omega: number;
  /** Length as a fraction of the radius. */
  length: number;
  active: boolean;
}

type Params = typeof CLOCK_PARAMS;

const SHAPE_KEYS = Object.keys(CLOCK_SHAPES) as ClockShape[];
const WEIGHTS = SHAPE_KEYS.map((k) => CLOCK_SHAPE_WEIGHTS[k] ?? 1);
const WEIGHT_SUM = WEIGHTS.reduce((a, b) => a + b, 0);
const TAU = Math.PI * 2;

/** Coarse stand-in for the original GPU fluid sim: a decaying, gaussian-splatted velocity grid. */
const FLOW_RES = 32;
/** Fluid sim resolution of the original (scales the force). */
const FLUID_SIM_RES = 128;
/** The real fluid's pressure projection removes roughly half of a splat's energy. */
const FLOW_GAIN = 0.5;

function pickShape(): number {
  let r = Math.random() * WEIGHT_SUM;
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i];
    if (r < 0) return i;
  }
  return WEIGHTS.length - 1;
}

/**
 * CPU port of the clock's GPU particle sim (Jacobi-style position-based
 * contacts, hand sweeping, rim collision) rendered with Canvas 2D.
 */
export class ClockSim {
  private n: number;
  private shape: Uint8Array;
  private radius: Float32Array;
  private color: Uint8Array;
  private pos: Float32Array;
  private vel: Float32Array;
  private nextPos: Float32Array;
  private nextVel: Float32Array;
  private ang: Float32Array;
  private av: Float32Array;
  private flow = new Float32Array(FLOW_RES * FLOW_RES * 2);
  private paths: Path2D[];
  private ctx: CanvasRenderingContext2D;

  constructor(
    private canvas: HTMLCanvasElement,
    private size: number,
    private dpr: number,
    private params: Params = CLOCK_PARAMS,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.n = params.count;
    this.shape = new Uint8Array(this.n);
    this.radius = new Float32Array(this.n);
    this.color = new Uint8Array(this.n);
    this.pos = new Float32Array(this.n * 2);
    this.vel = new Float32Array(this.n * 2);
    this.nextPos = new Float32Array(this.n * 2);
    this.nextVel = new Float32Array(this.n * 2);
    this.ang = new Float32Array(this.n);
    this.av = new Float32Array(this.n);
    this.paths = SHAPE_KEYS.map((k) => new Path2D(CLOCK_SHAPES[k]));
    this.resize(size, dpr, true);
    this.respawn();
  }

  resize(size: number, dpr: number, initial = false) {
    const scale = initial ? 1 : size / this.size;
    this.size = size;
    this.dpr = dpr;
    const px = Math.round(size * dpr);
    this.canvas.width = px;
    this.canvas.height = px;
    if (!initial && scale !== 1) {
      for (let i = 0; i < this.pos.length; i++) {
        this.pos[i] *= scale;
        this.vel[i] *= scale;
      }
      for (let i = 0; i < this.n; i++) this.radius[i] *= scale;
    }
  }

  respawn() {
    const { n, size, params } = this;
    const base = size * params.size * 0.5;
    let maxR = 0;
    for (let i = 0; i < n; i++) {
      this.shape[i] = pickShape();
      this.radius[i] = base * (1 + (Math.random() * 2 - 1) * params.sizeVariance);
      this.color[i] = i % CLOCK_PALETTE.length;
      maxR = Math.max(maxR, this.radius[i]);
      this.vel[i * 2] = this.vel[i * 2 + 1] = 0;
      this.ang[i] = Math.random() * TAU;
      this.av[i] = 0;
    }
    const half = size / 2;
    const rim = size * params.rim;
    const cell = maxR * 2.15;
    let l = 0;
    for (let y = rim * 0.1 + maxR; l < n && y < size; y += cell) {
      const jitter = (Math.random() - 0.5) * cell * 0.5;
      for (let x = maxR + jitter; l < n && x < size; x += cell) {
        if (Math.hypot(x - half, y - half) > rim - this.radius[l]) continue;
        this.pos[l * 2] = x + (Math.random() - 0.5) * cell * 0.2;
        this.pos[l * 2 + 1] = y + (Math.random() - 0.5) * cell * 0.2;
        l++;
      }
    }
    for (; l < n; l++) {
      this.pos[l * 2] = half + (Math.random() - 0.5) * size * 0.5;
      this.pos[l * 2 + 1] = size * 0.15 + Math.random() * size * 0.3;
    }
    this.flow.fill(0);
  }

  /** Adds a pointer stroke (velocity in clock-widths, scaled like the original splat) to the flow field. */
  splat(x: number, y: number, dx: number, dy: number) {
    const radius = this.params.fluidRadius / 100;
    for (let gy = 0; gy < FLOW_RES; gy++) {
      for (let gx = 0; gx < FLOW_RES; gx++) {
        const ux = (gx + 0.5) / FLOW_RES - x;
        const uy = (gy + 0.5) / FLOW_RES - y;
        const f = 2 ** (-(ux * ux + uy * uy) / radius);
        if (f < 1e-3) continue;
        const k = (gy * FLOW_RES + gx) * 2;
        this.flow[k] += dx * f;
        this.flow[k + 1] += dy * f;
      }
    }
  }

  /** Per-frame decay of the flow field (`fluidFade`). */
  fadeFlow() {
    const fade = this.params.fluidFade;
    for (let i = 0; i < this.flow.length; i++) this.flow[i] *= fade;
  }

  private sampleFlow(x: number, y: number, out: [number, number]) {
    const gx = Math.min(FLOW_RES - 1, Math.max(0, Math.floor((x / this.size) * FLOW_RES)));
    const gy = Math.min(FLOW_RES - 1, Math.max(0, Math.floor((y / this.size) * FLOW_RES)));
    const k = (gy * FLOW_RES + gx) * 2;
    out[0] = this.flow[k];
    out[1] = this.flow[k + 1];
  }

  step(dt: number, hands: SimHand[], fluidActive: boolean, steps: number) {
    for (let s = 0; s < steps; s++) this.substep(dt, hands, fluidActive);
  }

  private substep(dt: number, hands: SimHand[], fluidActive: boolean) {
    const p = this.params;
    const { n, size, pos, vel, nextPos, nextVel } = this;
    const c = size * 0.5;
    const R = size * p.rim;
    const sec = hands[0];
    const flow: [number, number] = [0, 0];
    const fluidScale = (size / FLUID_SIM_RES) * p.fluidForce * FLOW_GAIN;

    for (let i = 0; i < n; i++) {
      const ri = Math.max(this.radius[i], 1e-3);
      const ox = pos[i * 2];
      const oy = pos[i * 2 + 1];
      let vx = vel[i * 2];
      let vy = vel[i * 2 + 1];
      let av = this.av[i];

      const rx = ox - c;
      const ry = oy - c;
      const r = Math.max(Math.hypot(rx, ry), 1e-3);
      const phi = Math.atan2(rx, -ry);
      let ax = 0;
      let ay = p.gravity;

      // Wind swirling clockwise, strongest just behind the second hand.
      const wd = ((((phi - sec.angle + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
      const angular = 0.12 + 0.88 * (1 - Math.abs(wd) / Math.PI) ** 3;
      const windK = 600 * p.wind * angular * Math.min(Math.max(r / R, 0.2), 1);
      ax += Math.cos(phi) * windK;
      ay += Math.sin(phi) * windK;

      if (fluidActive) {
        this.sampleFlow(ox, oy, flow);
        ax += flow[0] * fluidScale;
        ay += flow[1] * fluidScale;
      }

      const drag = Math.exp(-p.drag * dt);
      vx = vx * drag + ax * dt;
      vy = vy * drag + ay * dt;
      av *= Math.exp(-p.spinDrag * dt);

      // Hands push shapes ahead of them.
      for (const h of hands) {
        if (!h.active) continue;
        const dhx = Math.sin(h.angle);
        const dhy = -Math.cos(h.angle);
        const thx = Math.cos(h.angle);
        const thy = Math.sin(h.angle);
        const sAlong = rx * dhx + ry * dhy;
        if (sAlong <= 0 || sAlong >= h.length * c) continue;
        const qx = rx - sAlong * dhx;
        const qy = ry - sAlong * dhy;
        const dist = Math.hypot(qx, qy);
        const w = p.handWidth + ri;
        if (dist >= w + p.handBand) continue;
        const side = qx * thx + qy * thy >= 0 ? 1 : -1;
        const u = h.omega * sAlong;
        const k = p.sweep * Math.min(Math.max(1 - (dist - w) / Math.max(p.handBand, 1e-3), 0), 1);
        if (side > 0) {
          const vt = vx * thx + vy * thy;
          if (vt < u) {
            vx += thx * (u - vt) * k;
            vy += thy * (u - vt) * k;
            av += ((u - vt) * k * 0.5) / ri;
          }
        }
        vx += thx * side * 7200 * dt * k;
        vy += thy * side * 7200 * dt * k;
      }

      // Contacts against the previous state of every other shape.
      const predX = ox + vx * dt;
      const predY = oy + vy * dt;
      let corrX = 0;
      let corrY = 0;
      let angAcc = 0;
      let contacts = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const dx = predX - pos[j * 2];
        const dy = predY - pos[j * 2 + 1];
        const rr = ri + this.radius[j];
        if (Math.abs(dx) >= rr || Math.abs(dy) >= rr) continue;
        const d = Math.hypot(dx, dy);
        if (d >= rr || d <= 1e-4) continue;
        const nx = dx / d;
        const ny = dy / d;
        corrX += nx * (rr - d) * 0.5;
        corrY += ny * (rr - d) * 0.5;
        const rvx = vx - vel[j * 2];
        const rvy = vy - vel[j * 2 + 1];
        const dn = rvx * nx + rvy * ny;
        const tx = rvx - nx * dn;
        const ty = rvy - ny * dn;
        corrX -= tx * dt * p.contactFriction * 0.5;
        corrY -= ty * dt * p.contactFriction * 0.5;
        const slip = nx * ty - ny * tx;
        angAcc += (-slip / ri) * p.spin;
        contacts++;
      }

      const inv = 1 / Math.max(dt, 1e-4);
      let pushX = corrX * p.relax * inv;
      let pushY = corrY * p.relax * inv;
      const pushSpeed = Math.hypot(pushX, pushY);
      if (pushSpeed > p.pushLimit) {
        pushX *= p.pushLimit / pushSpeed;
        pushY *= p.pushLimit / pushSpeed;
      }
      let px = predX + corrX * p.relax;
      let py = predY + corrY * p.relax;
      vx = (predX - ox) * inv + pushX;
      vy = (predY - oy) * inv + pushY;
      av += angAcc * dt;
      if (contacts > 0) {
        const damp = Math.exp(-p.contactDamping * dt);
        vx *= damp;
        vy *= damp;
        av *= Math.exp(-p.spinContactDrag * dt);
        if (Math.hypot(vx, vy) < p.sleep) {
          vx = vy = av = 0;
        }
      }
      let ang = this.ang[i] + av * dt;

      // Keep shapes out of the hands.
      for (const h of hands) {
        if (!h.active) continue;
        const dhx = Math.sin(h.angle);
        const dhy = -Math.cos(h.angle);
        const thx = Math.cos(h.angle);
        const thy = Math.sin(h.angle);
        const qx0 = px - c;
        const qy0 = py - c;
        const sAlong = qx0 * dhx + qy0 * dhy;
        if (sAlong <= 0 || sAlong >= h.length * c) continue;
        const qx = qx0 - sAlong * dhx;
        const qy = qy0 - sAlong * dhy;
        const w = p.handWidth + ri;
        if (Math.hypot(qx, qy) >= w) continue;
        const side = qx * thx + qy * thy >= 0 ? 1 : -1;
        px = c + dhx * sAlong + thx * side * w;
        py = c + dhy * sAlong + thy * side * w;
      }

      // Rim.
      const lim = R - ri;
      const r2x = px - c;
      const r2y = py - c;
      const r2 = Math.hypot(r2x, r2y);
      if (r2 > lim) {
        const hx = r2x / Math.max(r2, 1e-5);
        const hy = r2y / Math.max(r2, 1e-5);
        px = c + hx * lim;
        py = c + hy * lim;
        const vr = vx * hx + vy * hy;
        if (vr > 0) {
          vx -= (1 + p.restitution) * vr * hx;
          vy -= (1 + p.restitution) * vr * hy;
        }
        const radial = vx * hx + vy * hy;
        const keep = 1 - 0.5 * p.friction;
        vx = hx * radial + (vx - hx * radial) * keep;
        vy = hy * radial + (vy - hy * radial) * keep;
        av = (vx * -hy + vy * hx) / ri;
      }

      av = Math.min(Math.max(av, -p.maxSpin), p.maxSpin);
      const sp = Math.hypot(vx, vy);
      if (sp > p.maxSpeed) {
        vx = (vx / sp) * p.maxSpeed;
        vy = (vy / sp) * p.maxSpeed;
      }

      if (!Number.isFinite(px + py + vx + vy + ang + av)) {
        px = c + (Math.random() - 0.5) * size * 0.5;
        py = size * 0.15 + Math.random() * size * 0.3;
        vx = vy = av = ang = 0;
      }

      nextPos[i * 2] = px;
      nextPos[i * 2 + 1] = py;
      nextVel[i * 2] = vx;
      nextVel[i * 2 + 1] = vy;
      this.ang[i] = ang;
      this.av[i] = av;
    }

    this.pos = nextPos;
    this.vel = nextVel;
    this.nextPos = pos;
    this.nextVel = vel;
  }

  render() {
    const { ctx, dpr, n } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < n; i++) {
      const hs = this.radius[i] * this.params.drawScale;
      const unit = (hs * 2 * 0.96) / 100;
      const cos = Math.cos(this.ang[i]);
      const sin = Math.sin(this.ang[i]);
      // translate(pos) · rotate(ang) · translate(-hs + 2% padding) · scale(unit), all × dpr.
      const ox = -hs + hs * 0.04;
      ctx.setTransform(
        cos * unit * dpr,
        sin * unit * dpr,
        -sin * unit * dpr,
        cos * unit * dpr,
        (this.pos[i * 2] + cos * ox - sin * ox) * dpr,
        (this.pos[i * 2 + 1] + sin * ox + cos * ox) * dpr,
      );
      ctx.fillStyle = CLOCK_PALETTE[this.color[i]];
      ctx.fill(this.paths[this.shape[i]]);
    }
  }
}
