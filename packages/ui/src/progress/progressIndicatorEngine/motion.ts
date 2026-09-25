export const INDETERMINATE_CYCLE_MS = 10800;

const GLOBAL_ROTATION_TURNS = 3;
const ROTATION_STEP_COUNT = 4;
const ROTATION_STEP_DEG = 90;
const ROTATION_STEP_DURATION = 900 / INDETERMINATE_CYCLE_MS;
const ROTATION_STEP_INTERVAL = 2700 / INDETERMINATE_CYCLE_MS;
const SWEEP_MIN = 0.1;
const SWEEP_MAX = 0.87;
const START_OFFSET_DEG = 90;

const bezierX1 = 0.2;
const bezierX2 = 0;
const bezierY1 = 0;
const bezierY2 = 1;

const sampleBezier = (t: number, a: number, b: number): number => {
  const u = 1 - t;
  return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
};

const sampleBezierDerivative = (t: number, a: number, b: number): number => {
  const u = 1 - t;
  return 3 * u * u * a + 6 * u * t * (b - a) + 3 * t * t * (1 - b);
};

export const STANDARD_EASING = (t: number): number => {
  const clamped = Math.min(1, Math.max(0, t));
  let guess = clamped;
  for (let i = 0; i < 5; i++) {
    const x = sampleBezier(guess, bezierX1, bezierX2) - clamped;
    const dx = sampleBezierDerivative(guess, bezierX1, bezierX2);
    if (Math.abs(dx) < 1e-6) break;
    guess -= x / dx;
  }
  return sampleBezier(guess, bezierY1, bezierY2);
};

const sweepAt = (t: number): number => {
  const growing = t <= 0.5;
  const eased = STANDARD_EASING(growing ? t * 2 : (t - 0.5) * 2);
  const range = SWEEP_MAX - SWEEP_MIN;
  return growing ? SWEEP_MIN + range * eased : SWEEP_MAX - range * eased;
};

const additionalRotationDeg = (t: number): number => {
  const step = Math.min(Math.floor(t / ROTATION_STEP_INTERVAL), ROTATION_STEP_COUNT - 1);
  const fraction = Math.min(
    1,
    Math.max(0, (t - step * ROTATION_STEP_INTERVAL) / ROTATION_STEP_DURATION),
  );
  return (step + STANDARD_EASING(fraction)) * ROTATION_STEP_DEG;
};

export type IndeterminateMotion = {
  progress: number;
  rotationRad: number;
};

export const resolveIndeterminateMotion = (elapsedMs: number): IndeterminateMotion => {
  const t = (elapsedMs % INDETERMINATE_CYCLE_MS) / INDETERMINATE_CYCLE_MS;
  const rotationDeg = t * GLOBAL_ROTATION_TURNS * 360 + additionalRotationDeg(t) + START_OFFSET_DEG;
  return {
    progress: sweepAt(t),
    rotationRad: (rotationDeg * Math.PI) / 180,
  };
};

export const LINEAR_INDETERMINATE_CYCLE_MS = 3150;

const FIRST_LINE_HEAD_DURATION = 1800;
const FIRST_LINE_TAIL_DURATION = 1800;
const SECOND_LINE_HEAD_DURATION = 1530;
const SECOND_LINE_TAIL_DURATION = 1530;
const FIRST_LINE_HEAD_DELAY = 0;
const FIRST_LINE_TAIL_DELAY = 450;
const SECOND_LINE_HEAD_DELAY = 1170;
const SECOND_LINE_TAIL_DELAY = 1620;

const linearBezierX1 = 0.3;
const linearBezierX2 = 0.8;
const linearBezierY1 = 0;
const linearBezierY2 = 0.15;

export const LINEAR_INDETERMINATE_EASING = (t: number): number => {
  const clamped = Math.min(1, Math.max(0, t));
  let guess = clamped;
  for (let i = 0; i < 5; i++) {
    const x = sampleBezier(guess, linearBezierX1, linearBezierX2) - clamped;
    const dx = sampleBezierDerivative(guess, linearBezierX1, linearBezierX2);
    if (Math.abs(dx) < 1e-6) break;
    guess -= x / dx;
  }
  return sampleBezier(guess, linearBezierY1, linearBezierY2);
};

const keyframeProgress = (elapsedInCycle: number, delay: number, duration: number): number => {
  if (elapsedInCycle <= delay) return 0;
  if (elapsedInCycle >= delay + duration) return 1;
  return LINEAR_INDETERMINATE_EASING((elapsedInCycle - delay) / duration);
};

export type LinearIndeterminateMotion = {
  firstHead: number;
  firstTail: number;
  secondHead: number;
  secondTail: number;
};

export const resolveLinearIndeterminateMotion = (elapsedMs: number): LinearIndeterminateMotion => {
  const t = elapsedMs % LINEAR_INDETERMINATE_CYCLE_MS;
  return {
    firstHead: keyframeProgress(t, FIRST_LINE_HEAD_DELAY, FIRST_LINE_HEAD_DURATION),
    firstTail: keyframeProgress(t, FIRST_LINE_TAIL_DELAY, FIRST_LINE_TAIL_DURATION),
    secondHead: keyframeProgress(t, SECOND_LINE_HEAD_DELAY, SECOND_LINE_HEAD_DURATION),
    secondTail: keyframeProgress(t, SECOND_LINE_TAIL_DELAY, SECOND_LINE_TAIL_DURATION),
  };
};
