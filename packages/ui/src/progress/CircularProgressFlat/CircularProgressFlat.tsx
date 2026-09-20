import {
  Box,
  CircularProgress as MuiCircularProgress,
  type CircularProgressProps as MuiCircularProgressProps,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

const DEFAULT_SIZE_PX = 48;
const DEFAULT_THICKNESS_PX = 4;
const MUI_VIEWBOX_SIZE = 44;

export type CircularProgressFlatProps = MuiCircularProgressProps & {
  enableTrackSlot?: boolean;
};

const thicknessForSize = (size: number | string): number => {
  const sizePx = typeof size === "number" ? size : DEFAULT_SIZE_PX;
  return (DEFAULT_THICKNESS_PX * MUI_VIEWBOX_SIZE) / sizePx;
};

export const CircularProgressFlat = ({
  enableTrackSlot = true,
  size = DEFAULT_SIZE_PX,
  thickness,
  sx,
  ...rest
}: CircularProgressFlatProps) => {
  const theme = useTheme();
  const resolvedThickness = thickness ?? thicknessForSize(size);
  const sizePx = typeof size === "number" ? size : DEFAULT_SIZE_PX;

  const progressNode = (
    <MuiCircularProgress
      size={size}
      thickness={resolvedThickness}
      {...rest}
      sx={{
        "& .MuiCircularProgress-circle": {
          strokeLinecap: "round",
        },
        ...sx,
      }}
    />
  );

  if (!enableTrackSlot) {
    return progressNode;
  }

  const radius = (MUI_VIEWBOX_SIZE - resolvedThickness) / 2;
  const trackStroke = alpha(theme.palette.primary.main, 0.24);

  return (
    <Box
      component="span"
      sx={{
        position: "relative",
        display: "inline-flex",
        width: sizePx,
        height: sizePx,
      }}
    >
      <svg
        viewBox={`${MUI_VIEWBOX_SIZE / 2} ${MUI_VIEWBOX_SIZE / 2} ${MUI_VIEWBOX_SIZE} ${MUI_VIEWBOX_SIZE}`}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: sizePx,
          height: sizePx,
        }}
        aria-hidden="true"
      >
        <circle
          cx={MUI_VIEWBOX_SIZE}
          cy={MUI_VIEWBOX_SIZE}
          r={radius}
          fill="none"
          stroke={trackStroke}
          strokeWidth={resolvedThickness}
        />
      </svg>
      {progressNode}
    </Box>
  );
};
