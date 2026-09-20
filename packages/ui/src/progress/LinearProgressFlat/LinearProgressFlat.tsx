import {
  LinearProgress as MuiLinearProgress,
  type LinearProgressProps as MuiLinearProgressProps,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

const DEFAULT_HEIGHT_PX = 4;

export type LinearProgressFlatProps = MuiLinearProgressProps & {
  height?: number;
};

export const LinearProgressFlat = ({
  height = DEFAULT_HEIGHT_PX,
  sx,
  ...rest
}: LinearProgressFlatProps) => {
  const theme = useTheme();
  const borderRadius = `${height / 2}px`;

  return (
    <MuiLinearProgress
      {...rest}
      sx={{
        height,
        borderRadius,
        bgcolor: alpha(theme.palette.primary.main, 0.24),
        "& .MuiLinearProgress-bar": {
          borderRadius,
        },
        ...sx,
      }}
    />
  );
};
