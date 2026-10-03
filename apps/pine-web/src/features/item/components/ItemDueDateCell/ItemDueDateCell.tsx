import { Box, ButtonBase, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Calendar, Menu, MenuItem } from "@pine/ui";
import dayjs from "dayjs";
import { useState } from "react";

export type ItemDueDateCellProps = {
  itemId: string;
  value: string | null;
  disabled?: boolean;
  onChange: (dueDate: string | null) => void;
};

const formatDueDateLabel = (value: string | null): string => {
  if (!value) return "Set date";
  return dayjs(value).format("MMM D, YYYY");
};

const toDateValue = (value: string | null): Date | null => {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return null;
  return parsed.toDate();
};

const toIsoDate = (date: Date): string => dayjs(date).startOf("day").format();

export const ItemDueDateCell = ({ itemId, value, disabled, onChange }: ItemDueDateCellProps) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const selected = toDateValue(value);
  const triggerId = `due-date-trigger-${itemId}`;

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      onClick={(event) => {
        event.stopPropagation();
      }}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        minWidth: 120,
      }}
    >
      <ButtonBase
        id={triggerId}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          setAnchorEl(event.currentTarget);
        }}
        sx={{
          borderRadius: theme.shape.borderRadiusMedium,
          px: 1,
          py: 0.5,
          minHeight: theme.spacing(4),
          color: value ? theme.palette.text.primary : theme.palette.text.secondary,
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
          "&.Mui-disabled": {
            opacity: 0.38,
          },
        }}
      >
        <Typography variant="body2" noWrap>
          {formatDueDateLabel(value)}
        </Typography>
      </ButtonBase>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": triggerId,
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box
          component="li"
          sx={{
            listStyle: "none",
            px: 0,
            py: 0,
          }}
        >
          <Calendar
            value={selected}
            disabled={disabled}
            onChange={(next) => {
              if (!next) {
                onChange(null);
                handleClose();
                return;
              }
              onChange(toIsoDate(next));
              handleClose();
            }}
          />
        </Box>
        <MenuItem
          isDisabled={disabled || !value}
          onClick={() => {
            onChange(null);
            handleClose();
          }}
        >
          Clear due date
        </MenuItem>
      </Menu>
    </Box>
  );
};
