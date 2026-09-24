import MuiMenuItem from "@mui/material/MenuItem";
import { alpha, styled } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import type { MouseEvent, ReactNode } from "react";
import { pinePaletteDark, pinePaletteLight } from "../theme/color";
import { pineMotion } from "../theme/motion";
import { themeBorderRadiusExtraSmall } from "../theme/shape";

export type MenuItemProps = {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLLIElement>) => void;
  isDisabled?: boolean;
  selected?: boolean;
  dense?: boolean;
  sx?: SxProps<Theme>;
};

const StyledMenuItem = styled(MuiMenuItem)(({ theme }) => {
  const m3 = theme.palette.mode === "dark" ? pinePaletteDark : pinePaletteLight;
  const onSurfaceVariant = m3.onSurfaceVariant ?? theme.palette.text.secondary;

  return {
    borderRadius: themeBorderRadiusExtraSmall(theme),
    margin: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
    minHeight: theme.spacing(5),
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: theme.spacing(1.5),
    color: theme.palette.text.primary,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
    transition: theme.transitions.create(["background-color", "color"], {
      duration: pineMotion.duration.short2,
      easing: pineMotion.easing.standard,
    }),
    "&:hover": {
      backgroundColor: alpha(theme.palette.text.primary, 0.08),
    },
    "&.Mui-selected": {
      backgroundColor: `${m3.primaryContainer} !important`,
      color: m3.onPrimaryContainer,
      fontWeight: 500,
      "&:hover": {
        backgroundColor: `${alpha(m3.primaryContainer, 0.85)} !important`,
      },
      "&.Mui-focusVisible": {
        backgroundColor: `${m3.primaryContainer} !important`,
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: "1px",
      },
    },
    "&.Mui-focusVisible": {
      backgroundColor: alpha(theme.palette.text.primary, 0.12),
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: "1px",
    },
    "&.Mui-disabled": {
      opacity: 0.38,
      color: onSurfaceVariant,
    },
  };
});

export const MenuItem = ({
  children,
  onClick,
  isDisabled,
  selected,
  dense = false,
  sx,
}: MenuItemProps) => (
  <StyledMenuItem
    onClick={onClick}
    disabled={isDisabled}
    selected={selected}
    dense={dense}
    disableRipple
    sx={sx}
  >
    {children}
  </StyledMenuItem>
);
