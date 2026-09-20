const TWO_PI = Math.PI * 2;
const MIN_WAVE_COUNT = 3;
const START_ANGLE = -Math.PI / 2;

export type WavyCircularDrawOptions = {
  color: string;
  trackColor: string;
  strokeWidth: number;
  progress: number;
  rotationRad: number;
  amplitude: number;
  wavelength: number;
  wavePhaseRad: number;
  gapPx: number;
};

export const setupProgressCanvas = (
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number = cssWidth,
): CanvasRenderingContext2D => {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const pxW = Math.round(cssWidth * dpr);
  const pxH = Math.round(cssHeight * dpr);
  canvas.width = pxW;
  canvas.height = pxH;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable");
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
};

const waveCountFor = (radius: number, wavelength: number): number =>
  Math.max(MIN_WAVE_COUNT, Math.round((TWO_PI * radius) / wavelength));

const gapAngleFor = (radius: number, gapPx: number, strokeWidth: number): number => {
  if (radius <= 0) return 0;
  return (gapPx + strokeWidth) / radius;
};

const buildWavyArc = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  start: number,
  sweep: number,
  amplitude: number,
  waveCount: number,
  phase: number,
): void => {
  const steps = Math.max(24, Math.ceil(Math.abs(sweep) * radius * 1.5));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = start + sweep * t;
    const r = radius + amplitude * Math.sin(waveCount * angle + phase);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
};

const buildFlatArc = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  start: number,
  sweep: number,
): void => {
  const steps = Math.max(16, Math.ceil(Math.abs(sweep) * radius));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = start + sweep * t;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
};

export const drawWavyCircularProgress = (
  ctx: CanvasRenderingContext2D,
  cssSize: number,
  options: WavyCircularDrawOptions,
): void => {
  const {
    color,
    trackColor,
    strokeWidth,
    progress,
    rotationRad,
    amplitude,
    wavelength,
    wavePhaseRad,
    gapPx,
  } = options;

  ctx.clearRect(0, 0, cssSize, cssSize);

  const clampedProgress = Math.min(1, Math.max(0, progress));
  const maxAmplitude = Math.max(0, amplitude);
  const radius = (cssSize - strokeWidth) / 2 - maxAmplitude;
  if (radius <= 0) return;

  const cx = cssSize / 2;
  const cy = cssSize / 2;
  const waveCount = waveCountFor(radius, wavelength);
  const gapAngle = gapAngleFor(radius, gapPx, strokeWidth);
  const progressSweep = clampedProgress * TWO_PI;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationRad);
  ctx.translate(-cx, -cy);

  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = trackColor;

  const trackStart = START_ANGLE + progressSweep + gapAngle;
  const trackSweep = TWO_PI - progressSweep - gapAngle * 2;
  if (trackSweep > 0.001) {
    ctx.beginPath();
    buildFlatArc(ctx, cx, cy, radius, trackStart, trackSweep);
    ctx.stroke();
  }

  if (progressSweep > 0.001) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    buildWavyArc(
      ctx,
      cx,
      cy,
      radius,
      START_ANGLE,
      progressSweep,
      maxAmplitude,
      waveCount,
      wavePhaseRad,
    );
    ctx.stroke();
  }

  ctx.restore();
};

export type LinearProgressSegment = {
  start: number;
  end: number;
};

export type WavyLinearDrawOptions = {
  color: string;
  trackColor: string;
  strokeWidth: number;
  amplitude: number;
  wavelength: number;
  wavePhaseRad: number;
  gapPx: number;
  stopSize: number;
  segments: LinearProgressSegment[];
  showStop: boolean;
};

const buildWavyLine = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  cy: number,
  amplitude: number,
  wavelength: number,
  phase: number,
): void => {
  const length = Math.abs(x1 - x0);
  if (length < 0.001) return;
  const steps = Math.max(8, Math.ceil(length * 1.5));
  const dir = x1 >= x0 ? 1 : -1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + dir * length * t;
    const y =
      amplitude > 0
        ? cy + amplitude * Math.sin((TWO_PI * x) / wavelength + phase)
        : cy;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
};

const buildFlatLine = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  cy: number,
): void => {
  ctx.moveTo(x0, cy);
  ctx.lineTo(x1, cy);
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const drawWavyLinearProgress = (
  ctx: CanvasRenderingContext2D,
  cssWidth: number,
  cssHeight: number,
  options: WavyLinearDrawOptions,
): void => {
  const {
    color,
    trackColor,
    strokeWidth,
    amplitude,
    wavelength,
    wavePhaseRad,
    gapPx,
    stopSize,
    segments,
    showStop,
  } = options;

  ctx.clearRect(0, 0, cssWidth, cssHeight);

  if (cssWidth <= 0 || cssHeight <= 0) return;

  const halfStroke = strokeWidth / 2;
  const usableStart = halfStroke;
  const usableEnd = Math.max(usableStart, cssWidth - halfStroke);
  const usableWidth = usableEnd - usableStart;
  const cy = cssHeight / 2;
  const maxAmplitude = Math.max(0, amplitude);
  const safeWavelength = Math.max(1, wavelength);
  const gap = Math.max(0, gapPx);

  const active = segments
    .map((segment) => ({
      start: clamp01(Math.min(segment.start, segment.end)),
      end: clamp01(Math.max(segment.start, segment.end)),
    }))
    .filter((segment) => segment.end - segment.start > 0.0005)
    .sort((a, b) => a.start - b.start);

  const toX = (fraction: number): number => usableStart + usableWidth * fraction;

  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const trackGaps: LinearProgressSegment[] = [];
  let cursor = 0;
  for (const segment of active) {
    const gapStart = Math.max(0, segment.start - gap / usableWidth);
    const gapEnd = Math.min(1, segment.end + gap / usableWidth);
    if (cursor < gapStart) {
      trackGaps.push({ start: cursor, end: gapStart });
    }
    cursor = Math.max(cursor, gapEnd);
  }
  if (cursor < 1) {
    trackGaps.push({ start: cursor, end: 1 });
  }

  ctx.strokeStyle = trackColor;
  for (const gapSegment of trackGaps) {
    const x0 = toX(gapSegment.start);
    const x1 = toX(gapSegment.end);
    if (x1 - x0 < 0.5) continue;
    ctx.beginPath();
    buildFlatLine(ctx, x0, x1, cy);
    ctx.stroke();
  }

  ctx.strokeStyle = color;
  for (const segment of active) {
    const x0 = toX(segment.start);
    const x1 = toX(segment.end);
    if (x1 - x0 < 0.5) continue;
    ctx.beginPath();
    buildWavyLine(ctx, x0, x1, cy, maxAmplitude, safeWavelength, wavePhaseRad);
    ctx.stroke();
  }

  if (showStop && stopSize > 0) {
    const hasFullProgress = active.some((segment) => segment.end >= 0.999);
    if (!hasFullProgress) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(usableEnd, cy, stopSize / 2, 0, TWO_PI);
      ctx.fill();
    }
  }
};
