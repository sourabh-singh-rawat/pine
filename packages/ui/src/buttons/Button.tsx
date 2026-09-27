import { alpha, styled } from "@mui/material/styles";
import MuiButton, { type ButtonProps as MuiButtonProps } from "@mui/material/Button";
import type { MouseEvent, ReactElement, ReactNode } from "react";
import { themeBorderRadiusMedium } from "../theme/shape";

const StyledButton = styled(MuiButton)(({ theme }) => ({
  textTransform: "none",
  borderRadius: themeBorderRadiusMedium(theme),
  "&:hover": {
    boxShadow: "none",
  },
  "&:focus": {
    boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
    borderColor: theme.palette.primary.main,
  },
}));

export interface ButtonProps {
  size?: "small" | "medium" | "large";
  type?: MuiButtonProps["type"];
  color?: MuiButtonProps["color"];
  label?: string | ReactElement;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  variant?: "text" | "outlined" | "contained";
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  isDisabled?: boolean;
  sx?: MuiButtonProps["sx"];
  form?: string;
}

export const Button = ({
  type = "button",
  label,
  size = "medium",
  startIcon,
  endIcon,
  variant = "contained",
  onClick,
  isDisabled,
  sx,
  color,
  form,
}: ButtonProps) => {
  return (
    <StyledButton
      type={type}
      size={size}
      variant={variant}
      color={color}
      startIcon={startIcon}
      endIcon={endIcon}
      onClick={onClick}
      disabled={isDisabled}
      disableRipple
      sx={sx}
      form={form}
    >
      {label}
    </StyledButton>
  );
};

export default Button;
