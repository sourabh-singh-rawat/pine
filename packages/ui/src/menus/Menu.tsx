import MuiMenu, { type MenuProps as MuiMenuProps } from "@mui/material/Menu";
import { useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { pinePaletteDark, pinePaletteLight } from "../theme/color";
import { themeBorderRadiusMedium } from "../theme/shape";

export type MenuAnchorPosition = {
  top: number;
  left: number;
};

export type MenuProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  anchorEl?: HTMLElement | null;
  anchorPosition?: MenuAnchorPosition | null;
  disableScrollLock?: boolean;
  sx?: SxProps<Theme>;
  MenuListProps?: MuiMenuProps["MenuListProps"];
  anchorOrigin?: MuiMenuProps["anchorOrigin"];
  transformOrigin?: MuiMenuProps["transformOrigin"];
};

export const Menu = ({
  anchorEl = null,
  anchorPosition = null,
  open,
  onClose,
  children,
  disableScrollLock = true,
  sx,
  MenuListProps,
  anchorOrigin,
  transformOrigin,
}: MenuProps) => {
  const theme = useTheme();
  const m3 = theme.palette.mode === "dark" ? pinePaletteDark : pinePaletteLight;
  const paperBorderRadius = themeBorderRadiusMedium(theme);
  const paperShadow = theme.shadows[3] ?? theme.shadows[1];

  const positionAnchorProps: Pick<MuiMenuProps, "anchorReference" | "anchorPosition"> | null =
    anchorPosition != null
      ? {
          anchorReference: "anchorPosition",
          anchorPosition,
        }
      : null;

  return (
    <MuiMenu
      {...(positionAnchorProps != null
        ? positionAnchorProps
        : {
            anchorEl,
          })}
      open={open}
      onClose={() => {
        onClose();
      }}
      disableScrollLock={disableScrollLock}
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
      transitionDuration={0}
      slotProps={{
        root: {
          disableScrollLock,
          slotProps: {
            backdrop: {
              invisible: true,
            },
          },
        },
      }}
      {...(anchorOrigin != null ? { anchorOrigin } : {})}
      {...(transformOrigin != null ? { transformOrigin } : {})}
      variant="menu"
      MenuListProps={{
        disablePadding: true,
        autoFocusItem: false,
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
