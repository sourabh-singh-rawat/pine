import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { pinePaletteDark, pinePaletteLight } from "../theme/color";
import { themeBorderRadiusRounded } from "../theme/shape";

export type CalendarProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  disabled?: boolean;
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, amount: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatMonthYear = (date: Date): string =>
  new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date);

const buildMonthCells = (month: Date): Array<Date | null> => {
  const first = startOfMonth(month);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const leading = first.getDay();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < leading; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
};

export const Calendar = ({
  value,
  onChange,
  month: controlledMonth,
  onMonthChange,
  disabled = false,
}: CalendarProps) => {
  const theme = useTheme();
  const m3 = theme.palette.mode === "dark" ? pinePaletteDark : pinePaletteLight;
  const [internalMonth, setInternalMonth] = useState(() =>
    startOfMonth(value ?? new Date()),
  );
  const visibleMonth = controlledMonth ? startOfMonth(controlledMonth) : internalMonth;
  const selected = value ? startOfDay(value) : null;
  const today = startOfDay(new Date());
  const cells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);

  const setVisibleMonth = (next: Date) => {
    if (onMonthChange) {
      onMonthChange(next);
      return;
    }
    setInternalMonth(next);
  };

  return (
    <Box
      sx={{
        width: theme.spacing(36),
        p: 1.5,
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <IconButton
          size="small"
          aria-label="Previous month"
          disabled={disabled}
          onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {formatMonthYear(visibleMonth)}
        </Typography>
        <IconButton
          size="small"
          aria-label="Next month"
          disabled={disabled}
          onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.25,
          mb: 0.5,
        }}
      >
        {WEEKDAY_LABELS.map((label) => (
          <Typography
            key={label}
            variant="caption"
            align="center"
            sx={{
              color: m3.onSurfaceVariant ?? theme.palette.text.secondary,
              fontWeight: 500,
              py: 0.5,
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.25,
        }}
      >
        {cells.map((cell, index) => {
          if (!cell) {
            return <Box key={`empty-${index}`} sx={{ aspectRatio: "1 / 1" }} />;
          }
          const isSelected = selected != null && isSameDay(cell, selected);
          const isToday = isSameDay(cell, today);
          return (
            <Box
              key={cell.toISOString()}
              component="button"
              type="button"
              disabled={disabled}
              aria-label={cell.toDateString()}
              aria-pressed={isSelected}
              onClick={() => onChange(startOfDay(cell))}
              sx={{
                aspectRatio: "1 / 1",
                border: "none",
                margin: 0,
                padding: 0,
                cursor: disabled ? "default" : "pointer",
                borderRadius: themeBorderRadiusRounded(theme),
                fontSize: theme.typography.body2.fontSize,
                lineHeight: 1,
                color: isSelected
                  ? (m3.onPrimary ?? theme.palette.primary.contrastText)
                  : (m3.onSurface ?? theme.palette.text.primary),
                backgroundColor: isSelected
                  ? (m3.primary ?? theme.palette.primary.main)
                  : "transparent",
                fontWeight: isSelected || isToday ? 600 : 400,
                outline: isToday && !isSelected
                  ? `1px solid ${m3.outline ?? theme.palette.divider}`
                  : "none",
                outlineOffset: "-1px",
                "&:hover": disabled
                  ? undefined
                  : {
                      backgroundColor: isSelected
                        ? (m3.primary ?? theme.palette.primary.main)
                        : alpha(theme.palette.text.primary, 0.08),
                    },
                "&:focus-visible": {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: "1px",
                },
                "&.Mui-disabled, &:disabled": {
                  opacity: 0.38,
                },
              }}
            >
              {cell.getDate()}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
