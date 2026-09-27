import CircularProgress from "@mui/material/CircularProgress";
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button";
import type { ReactElement, ReactNode } from "react";
import Button from "./Button";

export interface PrimaryButtonProps {
  label: string | ReactElement;
  size?: "small" | "medium" | "large";
  type?: MuiButtonProps["type"];
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: (e: unknown) => void;
  isDisabled?: boolean;
  loading?: boolean;
  form?: string;
}

export const PrimaryButton = ({
  label,
  size,
  type = "button",
  startIcon,
  endIcon,
  onClick,
  isDisabled,
  loading,
  form,
}: PrimaryButtonProps) => {
  return (
    <Button
      label={label}
      onClick={onClick}
      type={type}
      size={size}
      startIcon={loading ? <CircularProgress size={12} /> : startIcon}
      endIcon={endIcon}
      isDisabled={isDisabled || loading}
      form={form}
    />
  );
};

export default PrimaryButton;
