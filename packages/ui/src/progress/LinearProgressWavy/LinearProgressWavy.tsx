import { Box, type BoxProps, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useRef } from "react";
import {
  drawWavyLinearProgress,
  resolveLinearIndeterminateMotion,
  setupProgressCanvas,
  type LinearProgressSegment,
} from "../progressIndicatorEngine";

const DEFAULT_STROKE_PX = 4;
const DEFAULT_AMPLITUDE_PX = 1.75;
const DEFAULT_DETERMINATE_WAVELENGTH_PX = 50;
const DEFAULT_INDETERMINATE_WAVELENGTH_PX = 26;
const DEFAULT_GAP_PX = 4;
const DEFAULT_STOP_PX = 4;
const FULL_AMPLITUDE_PROGRESS_MIN = 0.1;
const FULL_AMPLITUDE_PROGRESS_MAX = 0.95;

export type LinearProgressWavyProps = Omit<BoxProps, "children" | "color"> & {
  value?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  amplitude?: number;
  wavelength?: number;
  waveSpeed?: number;
  gap?: number;
  stopSize?: number;
  paused?: boolean;
};

const determinateAmplitudeFactor = (progress: number): number => {
  if (progress <= FULL_AMPLITUDE_PROGRESS_MIN || progress >= FULL_AMPLITUDE_PROGRESS_MAX) {
    return 0;
  }
  return 1;
};

const resolveSegments = (value: number | undefined, elapsedMs: number): LinearProgressSegment[] => {
  if (value !== undefined) {
    const progress = Math.min(1, Math.max(0, value));
    return progress > 0 ? [{ start: 0, end: progress }] : [];
  }

  const motion = resolveLinearIndeterminateMotion(elapsedMs);
  const segments: LinearProgressSegment[] = [];
  if (motion.firstHead - motion.firstTail > 0) {
    segments.push({ start: motion.firstTail, end: motion.firstHead });
  }
  if (motion.secondHead - motion.secondTail > 0) {
    segments.push({ start: motion.secondTail, end: motion.secondHead });
  }
  return segments;
};

export const LinearProgressWavy = ({
  value,
  strokeWidth = DEFAULT_STROKE_PX,
  color,
  trackColor,
  amplitude = DEFAULT_AMPLITUDE_PX,
  wavelength,
  waveSpeed,
  gap = DEFAULT_GAP_PX,
  stopSize = DEFAULT_STOP_PX,
  paused = false,
  sx,
  ...rest
}: LinearProgressWavyProps) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const fillColor = color ?? theme.palette.primary.main;
  const resolvedTrackColor = trackColor ?? alpha(theme.palette.primary.main, 0.24);
  const indeterminate = value === undefined;
  const resolvedWavelength =
    wavelength ??
    (indeterminate ? DEFAULT_INDETERMINATE_WAVELENGTH_PX : DEFAULT_DETERMINATE_WAVELENGTH_PX);
  const resolvedWaveSpeed = waveSpeed ?? resolvedWavelength / 1.8;
  const height = strokeWidth + amplitude * 2;

  const propsRef = useRef({
    value,
    fillColor,
    resolvedTrackColor,
    strokeWidth,
    amplitude,
    wavelength: resolvedWavelength,
    waveSpeed: resolvedWaveSpeed,
    gap,
    stopSize,
    paused,
    height,
  });

  useEffect(() => {
    propsRef.current = {
      value,
      fillColor,
      resolvedTrackColor,
      strokeWidth,
      amplitude,
      wavelength: resolvedWavelength,
      waveSpeed: resolvedWaveSpeed,
      gap,
      stopSize,
      paused,
      height,
    };
  }, [
    value,
    fillColor,
    resolvedTrackColor,
    strokeWidth,
    amplitude,
    resolvedWavelength,
    resolvedWaveSpeed,
    gap,
    stopSize,
    paused,
    height,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let frameId = 0;
    let elapsedMs = 0;
    let waveDistancePx = 0;
    let lastTs = 0;
    let cssWidth = Math.max(1, container.clientWidth || 240);

    const resize = () => {
      cssWidth = Math.max(1, container.clientWidth || 240);
      setupProgressCanvas(canvas, cssWidth, propsRef.current.height);
    };

    resize();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            resize();
          })
        : null;
    observer?.observe(container);

    const loop = (timestamp: number) => {
      const next = propsRef.current;
      if (lastTs === 0) lastTs = timestamp;

      const dtMs = Math.min(64, timestamp - lastTs);
      lastTs = timestamp;

      if (!next.paused) {
        elapsedMs += dtMs;
        if (next.waveSpeed > 0 && next.amplitude > 0) {
          waveDistancePx += next.waveSpeed * (dtMs / 1000);
        }
      }

      const segments = resolveSegments(next.value, elapsedMs);
      const progress = next.value === undefined ? 0.5 : Math.min(1, Math.max(0, next.value ?? 0));
      const ampFactor = next.value === undefined ? 1 : determinateAmplitudeFactor(progress);
      const wavePhaseRad =
        next.wavelength > 0 ? (waveDistancePx / next.wavelength) * Math.PI * 2 : 0;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawWavyLinearProgress(ctx, cssWidth, next.height, {
          color: next.fillColor,
          trackColor: next.resolvedTrackColor,
          strokeWidth: next.strokeWidth,
          amplitude: next.amplitude * ampFactor,
          wavelength: next.wavelength,
          wavePhaseRad,
          gapPx: next.gap,
          stopSize: next.stopSize,
          segments,
          showStop: next.value !== undefined,
        });
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      observer?.disconnect();
    };
  }, [height]);

  const ariaValue =
    value === undefined ? undefined : Math.round(Math.min(100, Math.max(0, value * 100)));

  return (
    <Box
      ref={containerRef}
      component="span"
      role="progressbar"
      aria-label="Progress"
      aria-valuemin={value === undefined ? undefined : 0}
      aria-valuemax={value === undefined ? undefined : 100}
      aria-valuenow={ariaValue}
      sx={{
        display: "block",
        width: "100%",
        height,
        lineHeight: 0,
        overflow: "hidden",
        ...sx,
      }}
      {...rest}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height }} />
    </Box>
  );
};
