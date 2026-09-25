import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import MenuItem from "@mui/material/MenuItem";
import MuiSelect from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { alpha, styled, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactElement, ReactNode } from "react";
import { pinePaletteDark, pinePaletteLight } from "../theme/color";
import { pineMotion } from "../theme/motion";
import { themeBorderRadiusExtraSmall, themeBorderRadiusMedium } from "../theme/shape";
import { Label } from "./Label";

const StyledSelect = styled(MuiSelect)(({ theme }) => {
  const m3 = theme.palette.mode === "dark" ? pinePaletteDark : pinePaletteLight;
  const outline = m3.outlineVariant ?? theme.palette.divider;
  const hoverOutline = m3.outline ?? theme.palette.text.primary;
  const surface = m3.surfaceContainerLowest ?? theme.palette.background.default;
  const onSurfaceVar = m3.onSurfaceVariant ?? theme.palette.text.secondary;

  return {
    width: "100%",
    borderRadius: themeBorderRadiusMedium(theme),
    backgroundColor: surface,
    color: theme.palette.text.primary,
    transition: theme.transitions.create(["border-color", "background-color", "box-shadow"], {
      duration: pineMotion.duration.short3,
      easing: pineMotion.easing.standard,
    }),
    "& .MuiSelect-select": {
      fontSize: "inherit",
      display: "flex",
      alignItems: "center",
      minHeight: "1.4375em",
    },
    "& .MuiSelect-icon": {
      color: onSurfaceVar,
      transition: theme.transitions.create(["transform", "color"], {
        duration: pineMotion.duration.short3,
        easing: pineMotion.easing.standard,
      }),
    },
    "& .MuiSelect-iconOpen": {
      transform: "rotate(180deg)",
      color: theme.palette.primary.main,
    },
    "& fieldset": {
      borderColor: outline,
      transition: theme.transitions.create(["border-color", "border-width"], {
        duration: pineMotion.duration.short3,
        easing: pineMotion.easing.standard,
      }),
    },
    "&:hover fieldset": {
      borderColor: `${hoverOutline} !important`,
    },
    "&.Mui-focused": {
      boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
      borderColor: theme.palette.primary.main,
      "& fieldset": {
        borderWidth: "2px",
        borderColor: `${theme.palette.primary.main} !important`,
      },
      "& .MuiSelect-icon": {
        color: theme.palette.primary.main,
      },
      "&.Mui-error": {
        boxShadow: `${alpha(theme.palette.error.main, 0.25)} 0 0 0 0.2rem`,
        borderColor: theme.palette.error.main,
        "& fieldset": {
          borderWidth: "2px",
          borderColor: `${theme.palette.error.main} !important`,
        },
        "& .MuiSelect-icon": {
          color: theme.palette.error.main,
        },
      },
    },
    "&.Mui-error": {
      borderColor: theme.palette.error.main,
      "& fieldset": {
        borderColor: `${theme.palette.error.main} !important`,
      },
      "& .MuiSelect-icon": {
        color: theme.palette.error.main,
      },
    },
  };
});

const StyledMenuItem = styled(MenuItem)(({ theme }) => {
  const m3 = theme.palette.mode === "dark" ? pinePaletteDark : pinePaletteLight;

  return {
    borderRadius: themeBorderRadiusExtraSmall(theme),
    margin: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
    minHeight: theme.spacing(5),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1),
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
  };
});

const getFieldErrorMessage = (field: AnyFieldApi): string | undefined => {
  const errors = field.state.meta.errors;
  if (!errors?.length) return undefined;
  const first = errors[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "message" in first) {
    const msg = (first as { message?: unknown }).message;
    return typeof msg === "string" ? msg : undefined;
  }
  return undefined;
};

export type SelectOption = {
  id: string | number;
  name: ReactNode;
  disabled?: boolean;
};

export interface SelectProps {
  field?: AnyFieldApi;
  name?: string;
  value?: string | number;
  onChange?: (event: SelectChangeEvent<unknown>) => void;
  options?: SelectOption[];
  children?: ReactNode;
  label?: ReactElement | string;
  placeholder?: string;
  helperText?: string;
  description?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  variant?: "small" | "medium";
  displayEmpty?: boolean;
  autoFocus?: boolean;
  sx?: SxProps<Theme>;
}

export const Select = ({
  field,
  name,
  value,
  onChange,
  options,
  children,
  label,
  placeholder,
  helperText,
  description,
  isLoading,
  isDisabled,
  variant = "small",
  displayEmpty,
  autoFocus = false,
  sx,
}: SelectProps) => {
  const theme = useTheme();
  const m3 = theme.palette.mode === "dark" ? pinePaletteDark : pinePaletteLight;

  const resolvedName = field?.name ?? name;
  const resolvedValue = (field ? (field.state.value as string | number | undefined) : value) ?? "";
  const errorMessage = field ? getFieldErrorMessage(field) : undefined;
  const isError = Boolean(errorMessage);
  const resolvedHelperText = errorMessage ?? helperText;
  const shouldDisplayEmpty = displayEmpty ?? Boolean(placeholder);

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    if (field) field.handleChange(event.target.value);
    onChange?.(event);
  };

  const handleBlur = () => {
    field?.handleBlur();
  };

  const menuProps = {
    PaperProps: {
      style: {
        marginTop: theme.spacing(1),
        boxShadow: theme.shadows[3] ?? theme.shadows[1],
        borderRadius: themeBorderRadiusMedium(theme),
        backgroundColor: m3.surfaceContainerLow ?? theme.palette.background.paper,
        border: `1px solid ${m3.outlineVariant ?? theme.palette.divider}`,
        paddingTop: theme.spacing(0.5),
        paddingBottom: theme.spacing(0.5),
      },
    },
  };

  return (
    <Box>
      {label ? (
        <Box sx={{ pb: theme.spacing(1) }}>
          <Label
            id={resolvedName ?? ""}
            title={label}
            isLoading={isLoading}
            color={isError ? theme.palette.error.main : undefined}
          />
        </Box>
      ) : null}
      {isLoading ? (
        <Skeleton height={40} />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <FormControl fullWidth size={variant === "small" ? "small" : "medium"} error={isError}>
            <StyledSelect
              id={resolvedName}
              name={resolvedName}
              value={resolvedValue}
              onChange={handleChange}
              onBlur={handleBlur}
              displayEmpty={shouldDisplayEmpty}
              autoFocus={autoFocus}
              disabled={isDisabled}
              size={variant === "small" ? "small" : "medium"}
              MenuProps={menuProps}
              IconComponent={KeyboardArrowDownIcon}
              sx={sx}
            >
              {placeholder ? (
                <StyledMenuItem value="" disabled={!shouldDisplayEmpty}>
                  <Typography variant="body2" color="text.secondary">
                    {placeholder}
                  </Typography>
                </StyledMenuItem>
              ) : null}
              {options
                ? options.map((option) => {
                    const isSelected = String(resolvedValue) === String(option.id);
                    return (
                      <StyledMenuItem
                        key={String(option.id)}
                        value={option.id}
                        disabled={option.disabled}
                      >
                        <Typography variant="body2">{option.name}</Typography>
                        {isSelected ? (
                          <CheckIcon
                            fontSize="small"
                            sx={{ color: "inherit", fontSize: "1.125rem", flexShrink: 0 }}
                          />
                        ) : null}
                      </StyledMenuItem>
                    );
                  })
                : children}
            </StyledSelect>
            {resolvedHelperText ? (
              <FormHelperText
                sx={{ fontSize: theme.typography.body1.fontSize, ml: 0, mt: theme.spacing(1) }}
              >
                {resolvedHelperText}
              </FormHelperText>
            ) : null}
          </FormControl>
          {description ? (
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Box>
      )}
    </Box>
  );
};
