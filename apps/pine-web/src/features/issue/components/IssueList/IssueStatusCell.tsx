import { Box, IconButton } from "@mui/material";
import { Menu, MenuItem, MenuItemIcon } from "@pine/ui";
import { useState } from "react";
import type { StatusOption } from "@shared/contexts/StatusesContext";
import { getStatusIcon } from "./statusIcons";

export type IssueStatusCellProps = {
  issueId: string;
  statusId: string;
  statusName: string;
  statuses: StatusOption[];
  disabled?: boolean;
  onChange: (statusId: string) => void;
};

export const IssueStatusCell = ({
  issueId,
  statusId,
  statusName,
  statuses,
  disabled,
  onChange,
}: IssueStatusCellProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const triggerId = `status-trigger-${issueId}`;
  const statusOptions = statuses.filter(
    (status) => Boolean(status.id) && Boolean(status.name),
  );
  const hasStatuses = statusOptions.length > 0;

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      onClick={(event) => {
        event.stopPropagation();
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconButton
        id={triggerId}
        size="small"
        aria-label={`Change status, currently ${statusName}`}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        disabled={disabled || !hasStatuses}
        onClick={(event) => {
          event.stopPropagation();
          setAnchorEl(event.currentTarget);
        }}
      >
        {getStatusIcon(statusName)}
      </IconButton>
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
        {statusOptions.map((status) => (
          <MenuItem
            key={status.id}
            selected={status.id === statusId}
            isDisabled={disabled}
            onClick={() => {
              handleClose();
              if (status.id === statusId) return;
              onChange(status.id);
            }}
          >
            <MenuItemIcon>{getStatusIcon(status.name)}</MenuItemIcon>
            {status.name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
