import { Box, type BoxProps, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useRef } from "react";
import {
  drawWavyCircularProgress,
  resolveIndeterminateMotion,
  setupProgressCanvas,
} from "../progressIndicatorEngine";

const DEFAULT_SIZE_PX = 48;
const DEFAULT_STROKE_PX = 4;
const DEFAULT_WAVELENGTH_PX = 20;
const DEFAULT_WAVE_SPEED_PX = 8;
const DEFAULT_AMPLITUDE_PX = 1.75;
const DEFAULT_GAP_PX = 4;
const FULL_AMPLITUDE_PROGRESS_MIN = 0.1;
const FULL_AMPLITUDE_PROGRESS_MAX = 0.95;

export type CircularProgressWavyProps = Omit<
  BoxProps,
  "children" | "color"
> & {
  value?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  amplitude?: number;
  wavelength?: number;
  waveSpeed?: number;
  gap?: number;
  paused?: boolean;
};

const determinateAmplitudeFactor = (progress: number): number => {
  if (
    progress <= FULL_AMPLITUDE_PROGRESS_MIN ||
    progress >= FULL_AMPLITUDE_PROGRESS_MAX
  ) {
    return 0;
  }
  return 1;
};

export const CircularProgressWavy = ({
  value,
  size = DEFAULT_SIZE_PX,
  strokeWidth = DEFAULT_STROKE_PX,
  color,
  trackColor,
  amplitude = DEFAULT_AMPLITUDE_PX,
  wavelength = DEFAULT_WAVELENGTH_PX,
  waveSpeed = DEFAULT_WAVE_SPEED_PX,
  gap = DEFAULT_GAP_PX,
  paused = false,
  sx,
  ...rest
}: CircularProgressWavyProps) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fillColor = color ?? theme.palette.primary.main;
  const resolvedTrackColor =
    trackColor ?? alpha(theme.palette.primary.main, 0.24);
  const propsRef = useRef({
    value,
    fillColor,
    resolvedTrackColor,
    strokeWidth,
    amplitude,
    wavelength,
    waveSpeed,
    gap,
    paused,
  });

  useEffect(() => {
    propsRef.current = {
      value,
      fillColor,
      resolvedTrackColor,
      strokeWidth,
      amplitude,
      wavelength,
      waveSpeed,
      gap,
      paused,
    };
  }, [
    value,
    fillColor,
    resolvedTrackColor,
    strokeWidth,
    amplitude,
    wavelength,
    waveSpeed,
    gap,
    paused,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = setupProgressCanvas(canvas, size);
    let frameId = 0;
    let elapsedMs = 0;
    let waveDistancePx = 0;
    let lastTs = 0;

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

      const indeterminate = next.value === undefined;
      const motion = indeterminate
        ? resolveIndeterminateMotion(elapsedMs)
        : {
            progress: Math.min(1, Math.max(0, next.value ?? 0)),
            rotationRad: 0,
          };

      const ampFactor = indeterminate
        ? 1
        : determinateAmplitudeFactor(motion.progress);
      const radius = (size - next.strokeWidth) / 2 - next.amplitude * ampFactor;
      const wavePhaseRad = radius > 0 ? waveDistancePx / radius : 0;

      drawWavyCircularProgress(ctx, size, {
        color: next.fillColor,
        trackColor: next.resolvedTrackColor,
        strokeWidth: next.strokeWidth,
        progress: motion.progress,
        rotationRad: motion.rotationRad,
        amplitude: next.amplitude * ampFactor,
        wavelength: next.wavelength,
        wavePhaseRad,
        gapPx: next.gap,
      });

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [size]);

  const ariaValue =
    value === undefined
      ? undefined
      : Math.round(Math.min(100, Math.max(0, value * 100)));

  return (
    <Box
      component="span"
      role="progressbar"
      aria-label="Progress"
      aria-valuemin={value === undefined ? undefined : 0}
      aria-valuemax={value === undefined ? undefined : 100}
      aria-valuenow={ariaValue}
      sx={{
        display: "inline-flex",
        width: size,
        height: size,
        lineHeight: 0,
        ...sx,
      }}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: size, height: size }}
      />
    </Box>
  );
};
