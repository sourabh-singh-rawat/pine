import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import {
  Checkbox,
  ClickAwayListener,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type KeyboardEvent } from "react";
import type { ChecklistEntryView } from "./mapChecklist";

type ChecklistEntryItemProps = {
  entry: ChecklistEntryView;
  disabled: boolean;
  onToggle: (entryId: string, completed: boolean) => Promise<void>;
  onUpdateTitle: (entryId: string, title: string) => Promise<void>;
  onDelete: (entryId: string) => Promise<void>;
};

export const ChecklistEntryItem = ({
  entry,
  disabled,
  onToggle,
  onUpdateTitle,
  onDelete,
}: ChecklistEntryItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry.title);

  const startEditing = () => {
    if (disabled) {
      return;
    }
    setEditTitle(entry.title);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditTitle(entry.title);
  };

  const saveEditing = async () => {
    const trimmed = editTitle.trim();
    if (trimmed.length === 0) {
      cancelEditing();
      return;
    }

    if (trimmed === entry.title) {
      setIsEditing(false);
      return;
    }

    setIsEditing(false);
    await onUpdateTitle(entry.id, trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void saveEditing();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  };

  if (isEditing) {
    return (
      <ClickAwayListener onClickAway={() => void saveEditing()}>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: "100%", py: 0.25 }}>
          <TextField
            size="small"
            fullWidth
            autoFocus
            value={editTitle}
            disabled={disabled}
            onChange={(event) => {
              setEditTitle(event.target.value);
            }}
            onKeyDown={handleKeyDown}
            inputProps={{
              onFocus: (event) => event.target.select(),
              "aria-label": `Edit ${entry.title}`,
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
            aria-label="Save checklist item title"
            disabled={disabled}
            onClick={() => {
              void saveEditing();
            }}
          >
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Cancel editing checklist item title"
            disabled={disabled}
            onClick={cancelEditing}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </ClickAwayListener>
    );
  }

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Checkbox
        size="small"
        checked={entry.completed}
        disabled={disabled}
        onChange={(_event, checked) => {
          void onToggle(entry.id, checked);
        }}
        inputProps={{
          "aria-label": `Mark ${entry.title} ${entry.completed ? "incomplete" : "complete"}`,
        }}
      />
      <Typography
        variant="body2"
        onDoubleClick={startEditing}
        sx={{
          flex: 1,
          minWidth: 0,
          textDecoration: entry.completed ? "line-through" : "none",
          color: entry.completed ? "text.secondary" : "text.primary",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {entry.title}
      </Typography>
      <IconButton
        size="small"
        aria-label={`Edit ${entry.title}`}
        disabled={disabled}
        onClick={startEditing}
      >
        <EditOutlined fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label={`Delete ${entry.title}`}
        disabled={disabled}
        onClick={() => {
          void onDelete(entry.id);
        }}
      >
        <DeleteOutline fontSize="small" />
      </IconButton>
    </Stack>
  );
};
