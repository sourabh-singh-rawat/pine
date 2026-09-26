import { ClickAwayListener } from "@mui/base";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import {
  Box,
  CircularProgress,
  IconButton,
  Link as MuiLink,
  TextField,
  useTheme,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent, MouseEvent } from "react";
import { ItemChecklistCount } from "@features/item-checklists";
import { useSnackbar } from "@shared";

export interface ItemNameCellProps {
  itemId: string;
  name: string;
  isEditing: boolean;
  isSaving: boolean;
  depth?: number;
  hasChildren?: boolean;
  showExpandGutter?: boolean;
  isExpanded?: boolean;
  isExpanding?: boolean;
  checklistCompletedCount?: number;
  checklistTotalCount?: number;
  onStartEditing: () => void;
  onFinishEditing: () => void;
  onSave: (nextName: string) => Promise<boolean>;
  onToggleExpand?: () => void;
}

export const ItemNameCell = ({
  itemId,
  name,
  isEditing,
  isSaving,
  depth = 0,
  hasChildren = false,
  showExpandGutter = false,
  isExpanded = false,
  isExpanding = false,
  checklistCompletedCount = 0,
  checklistTotalCount = 0,
  onStartEditing,
  onFinishEditing,
  onSave,
  onToggleExpand,
}: ItemNameCellProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const [value, setValue] = useState(name);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isEditing) {
      setValue(name);
    }
  }, [isEditing, name]);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const handleCancel = () => {
    if (isSaving) return;
    setValue(name);
    onFinishEditing();
  };

  const handleCommit = async () => {
    if (isSaving) return;
    const trimmed = value.trim();
    if (!trimmed) {
      snackbar.error("Name cannot be empty");
      return;
    }
    if (trimmed === name) {
      onFinishEditing();
      return;
    }
    const success = await onSave(trimmed);
    if (success) {
      onFinishEditing();
    }
  };

  const handleClickAway = () => {
    if (isSaving) return;
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      handleCancel();
      return;
    }
    void handleCommit();
  };

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
      return;
    }
    if (event.detail > 1) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    clickTimerRef.current = setTimeout(() => {
      void navigate({ to: "/i/$itemId", params: { itemId } });
      clickTimerRef.current = null;
    }, 250);
  };

  const handleLinkDoubleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    onStartEditing();
  };

  const handleContainerDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    onStartEditing();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleCommit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void handleCommit();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  if (isEditing) {
    return (
      <ClickAwayListener onClickAway={handleClickAway}>
        <Box
          component="form"
          onSubmit={handleFormSubmit}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            width: "100%",
          }}
        >
          <TextField
            size="small"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={isSaving}
            fullWidth
            variant="outlined"
            inputProps={{
              onFocus: (event) => event.target.select(),
              "aria-label": "Edit item name",
            }}
            sx={{
              "& .MuiInputBase-root": {
                height: 32,
                fontSize: "0.875rem",
              },
              "& .MuiOutlinedInput-input": {
                py: 0.5,
                px: 1,
              },
            }}
          />
          <IconButton
            size="small"
            type="submit"
            aria-label="Save item name"
            disabled={isSaving}
            sx={{ p: 0.25 }}
          >
            <DoneIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            type="button"
            aria-label="Cancel item name edit"
            onClick={handleCancel}
            disabled={isSaving}
            sx={{ p: 0.25 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </ClickAwayListener>
    );
  }

  const handleExpandClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleExpand?.();
  };

  return (
    <Box
      onDoubleClick={handleContainerDoubleClick}
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        py: 0.5,
        pl: depth > 0 ? 2 : 0,
        gap: 0.25,
      }}
    >
      {hasChildren ? (
        <IconButton
          size="small"
          aria-label={isExpanded ? "Collapse sub-items" : "Expand sub-items"}
          onClick={handleExpandClick}
          disabled={isExpanding}
          sx={{ p: 0.25, flexShrink: 0 }}
        >
          {isExpanding ? (
            <CircularProgress size={14} />
          ) : isExpanded ? (
            <KeyboardArrowDownIcon fontSize="small" />
          ) : (
            <KeyboardArrowRightIcon fontSize="small" />
          )}
        </IconButton>
      ) : showExpandGutter || depth > 0 ? (
        <Box sx={{ width: 28, flexShrink: 0 }} />
      ) : null}
      <MuiLink
        href={`/i/${itemId}`}
        underline="none"
        onClick={handleLinkClick}
        onDoubleClick={handleLinkDoubleClick}
        sx={{
          color: theme.palette.text.primary,
          "&:hover": {
            color: theme.palette.primary.main,
          },
        }}
      >
        {name}
      </MuiLink>
      <ItemChecklistCount
        completedCount={checklistCompletedCount}
        totalCount={checklistTotalCount}
      />
    </Box>
  );
};
