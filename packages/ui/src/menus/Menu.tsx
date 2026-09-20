import MuiMenu, { type MenuProps as MuiMenuProps } from "@mui/material/Menu";
import { useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { pinePaletteDark, pinePaletteLight } from "../theme/color";
import { themeBorderRadiusMedium } from "../theme/shape";

export type MenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  sx?: SxProps<Theme>;
  MenuListProps?: MuiMenuProps["MenuListProps"];
  anchorOrigin?: MuiMenuProps["anchorOrigin"];
  transformOrigin?: MuiMenuProps["transformOrigin"];
};

export const Menu = ({
  anchorEl,
  open,
  onClose,
  children,
  sx,
  MenuListProps,
  anchorOrigin,
  transformOrigin,
}: MenuProps) => {
  const theme = useTheme();
  const m3 = theme.palette.mode === "dark" ? pinePaletteDark : pinePaletteLight;
  const paperBorderRadius = themeBorderRadiusMedium(theme);
  const paperShadow = theme.shadows[3] ?? theme.shadows[1];

  return (
    <MuiMenu
      anchorEl={anchorEl}
      open={open}
      onClose={() => {
        onClose();
      }}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      variant="menu"
      MenuListProps={{
        disablePadding: true,
        ...MenuListProps,
      }}
      PaperProps={{
        sx: {
          mt: 1,
          py: 0.5,
          boxShadow: paperShadow,
          borderRadius: paperBorderRadius,
          backgroundColor: m3.surfaceContainerLow ?? theme.palette.background.paper,
          backgroundImage: "none",
          border: `1px solid ${m3.outlineVariant ?? theme.palette.divider}`,
          minWidth: theme.spacing(14),
          overflow: "hidden",
        },
      }}
      sx={sx}
    >
      {children}
    </MuiMenu>
  );
};
