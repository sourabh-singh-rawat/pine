import { Spring } from "./spring";

export const DURATION_PER_SHAPE_MS = 650;
export const CONSTANT_ROTATION_DEG = 50;
export const EXTRA_ROTATION_DEG = 90;
export const DEFAULT_SPRING_STIFFNESS = 200;
export const DEFAULT_SPRING_DAMPING = 0.6;

export interface AnimatorState {
  rotation: number;
  morph: number;
}

export class M3Animator {
  speed = 1;
  paused = false;

  rotation = 0;
  morph = 0;

  constructor(stiffness = DEFAULT_SPRING_STIFFNESS, damping = DEFAULT_SPRING_DAMPING) {
    this.spring = new Spring(stiffness, damping);
    this.spring.target = 1;
  }

  update(ts: number): void {
    if (this.paused) {
      this.lastTs = ts;
      return;
    }
    if (this.lastTs === 0) this.lastTs = ts;
    const rawDt = Math.min((ts - this.lastTs) / 1000, 0.1);
    const dt = rawDt * this.speed;
    this.lastTs = ts;
    if (dt <= 0) return;

    this.elapsed += dt * 1000;
    const cycle = Math.floor(this.elapsed / DURATION_PER_SHAPE_MS);

    if (cycle > this.prevCycle) {
      this.morphTarget += cycle - this.prevCycle;
      this.spring.target = this.morphTarget;
      this.prevCycle = cycle;
    }

    this.fraction = (this.elapsed % DURATION_PER_SHAPE_MS) / DURATION_PER_SHAPE_MS;
    this.spring.step(dt);

    const base = this.morphTarget - 1;
    const perShape = this.spring.pos - base;
    this.rotation =
      ((CONSTANT_ROTATION_DEG + EXTRA_ROTATION_DEG) * base +
        CONSTANT_ROTATION_DEG * this.fraction +
        EXTRA_ROTATION_DEG * perShape) %
      360;

    this.morph = this.spring.pos;
  }

  reset(): void {
    this.morphTarget = 1;
    this.fraction = 0;
    this.elapsed = 0;
    this.lastTs = 0;
    this.prevCycle = 0;
    this.spring.reset();
    this.spring.target = 1;
    this.rotation = 0;
    this.morph = 0;
  }

  getState(): AnimatorState {
    return { rotation: this.rotation, morph: this.morph };
  }

  private readonly spring: Spring;
  private morphTarget = 1;
  private fraction = 0;
  private elapsed = 0;
  private lastTs = 0;
  private prevCycle = 0;
}
