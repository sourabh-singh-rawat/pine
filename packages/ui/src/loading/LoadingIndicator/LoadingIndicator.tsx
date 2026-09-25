import { Box, type BoxProps, useTheme } from "@mui/material";
import { useEffect, useRef } from "react";
import { drawIndicator, getMorphedShape, M3Animator, setupCanvas } from "./loadingIndicatorEngine";

export type LoadingIndicatorProps = Omit<BoxProps, "children" | "color"> & {
  size?: number;
  color?: string;
  sizeRatio?: number;
  speed?: number;
  paused?: boolean;
  contained?: boolean;
  containerColor?: string;
};

export const LoadingIndicator = ({
  size = 48,
  color,
  sizeRatio = 0.79,
  speed = 1,
  paused = false,
  contained = false,
  containerColor,
  sx,
  ...rest
}: LoadingIndicatorProps) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fillColor = color ?? theme.palette.primary.main;
  const propsRef = useRef({
    color: fillColor,
    sizeRatio,
    speed,
    paused,
    contained,
    containerColor,
  });

  useEffect(() => {
    propsRef.current = {
      color: fillColor,
      sizeRatio,
      speed,
      paused,
      contained,
      containerColor,
    };
  }, [fillColor, sizeRatio, speed, paused, contained, containerColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = setupCanvas(canvas, size);
    const animator = new M3Animator();
    let frameId = 0;

    const loop = (timestamp: number) => {
      const next = propsRef.current;
      animator.speed = next.speed;
      animator.paused = next.paused;
      animator.update(timestamp);
      const shape = getMorphedShape(animator.morph);
      drawIndicator(ctx, size, shape, animator.rotation, {
        color: next.color,
        sizeRatio: next.sizeRatio,
        contained: next.contained,
        containerColor: next.containerColor,
      });
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [size]);

  return (
    <Box
      component="span"
      role="progressbar"
      aria-label="Loading"
      sx={{
        display: "inline-flex",
        width: size,
        height: size,
        lineHeight: 0,
        ...sx,
      }}
      {...rest}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: size, height: size }} />
    </Box>
  );
};
