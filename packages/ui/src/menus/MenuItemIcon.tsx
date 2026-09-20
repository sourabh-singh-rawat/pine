import { styled } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export type MenuItemIconProps = {
  children: ReactNode;
  sx?: SxProps<Theme>;
};

const Root = styled("span")({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: 24,
  height: 24,
  color: "inherit",
  "& .MuiSvgIcon-root": {
    fontSize: 20,
  },
});

export const MenuItemIcon = ({ children, sx }: MenuItemIconProps) => (
  <Root sx={sx}>{children}</Root>
);
