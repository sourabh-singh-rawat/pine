import type { Point } from "./shapes";

export interface RenderOptions {
  color: string;
  sizeRatio?: number;
  contained?: boolean;
  containerColor?: string;
}

export const drawIndicator = (
  ctx: CanvasRenderingContext2D,
  cssSize: number,
  points: Point[],
  rotation: number,
  options: RenderOptions,
): void => {
  const ratio = options.sizeRatio ?? 0.79;
  const indicatorSize = cssSize * ratio;
  const cx = cssSize / 2;
  const cy = cssSize / 2;
  const scale = indicatorSize / 2;

  ctx.clearRect(0, 0, cssSize, cssSize);

  if (options.contained) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cssSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = options.containerColor ?? "rgba(0,0,0,0.08)";
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);

  ctx.beginPath();
  for (let i = 0; i <= points.length; i++) {
    const point = points[i % points.length];
    if (!point) continue;
    const [px, py] = point;
    if (i === 0) ctx.moveTo(px * scale, py * scale);
    else ctx.lineTo(px * scale, py * scale);
  }
  ctx.closePath();
  ctx.fillStyle = options.color;
  ctx.fill();
  ctx.restore();
};

export const setupCanvas = (
  canvas: HTMLCanvasElement,
  cssSize: number,
): CanvasRenderingContext2D => {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const px = Math.round(cssSize * dpr);
  canvas.width = px;
  canvas.height = px;
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable");
  }
  ctx.scale(dpr, dpr);
  return ctx;
};
