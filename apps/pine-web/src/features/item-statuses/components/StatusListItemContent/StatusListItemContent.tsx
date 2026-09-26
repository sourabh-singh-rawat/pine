import DeleteOutline from "@mui/icons-material/DeleteOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Box, Button, IconButton, Stack, TextField, Typography } from "@mui/material";
import { PrimaryButton, Select } from "@shared";
import { STATUS_TYPE_OPTIONS, type DraftStatus, type StatusRow } from "../../utils";

type StatusListItemContentProps = {
  status: StatusRow;
  isEditing: boolean;
  isDeleting: boolean;
  isBusy: boolean;
  canDelete: boolean;
  editDraft: DraftStatus;
  replacementStatusId: string;
  replacementOptions: Array<{ id: string; name: string }>;
  onEditDraftChange: (draft: DraftStatus) => void;
  onReplacementChange: (statusId: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onStartDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

export const StatusListItemContent = ({
  status,
  isEditing,
  isDeleting,
  isBusy,
  canDelete,
  editDraft,
  replacementStatusId,
  replacementOptions,
  onEditDraftChange,
  onReplacementChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
}: StatusListItemContentProps) => {
  if (isEditing) {
    return (
      <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            component="input"
            type="color"
            value={editDraft.color}
            disabled={isBusy}
            onChange={(event) => {
              onEditDraftChange({
                ...editDraft,
                color: event.target.value.toUpperCase(),
              });
            }}
            aria-label={`Color for ${status.name}`}
            sx={{
              width: 40,
              height: 36,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              p: 0,
            }}
          />
          <TextField
            size="small"
            fullWidth
            label="Name"
            value={editDraft.name}
            disabled={isBusy}
            onChange={(event) => {
              onEditDraftChange({
                ...editDraft,
                name: event.target.value,
              });
            }}
          />
        </Stack>
        <Select
          name={`edit-type-${status.id}`}
          label="Type"
          value={editDraft.type}
          options={STATUS_TYPE_OPTIONS}
          isDisabled={isBusy}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (typeof nextValue !== "string" || !nextValue) {
              return;
            }
            onEditDraftChange({
              ...editDraft,
              type: nextValue,
            });
          }}
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={onCancelEdit} disabled={isBusy}>
            Cancel
          </Button>
          <PrimaryButton label="Save" onClick={onSaveEdit} isDisabled={isBusy} />
        </Stack>
      </Stack>
    );
  }

  if (isDeleting) {
    return (
      <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2">
          Delete <strong>{status.name}</strong>? Items using it will move to the status you choose.
        </Typography>
        <Select
          name={`replacement-${status.id}`}
          label="Move items to"
          value={replacementStatusId}
          options={replacementOptions}
          isDisabled={isBusy}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (typeof nextValue !== "string" || !nextValue) {
              return;
            }
            onReplacementChange(nextValue);
          }}
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={onCancelDelete} disabled={isBusy}>
            Cancel
          </Button>
          <PrimaryButton
            label="Delete"
            onClick={onConfirmDelete}
            isDisabled={isBusy || !replacementStatusId}
          />
        </Stack>
      </Stack>
    );
  }

  return (
    <>
      <Box
        sx={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          bgcolor: status.color,
          border: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" noWrap>
          {status.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {status.type}
        </Typography>
      </Box>
      <IconButton
        size="small"
        aria-label={`Edit ${status.name}`}
        disabled={isBusy}
        onClick={onStartEdit}
      >
        <EditOutlined fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label={`Delete ${status.name}`}
        disabled={isBusy || !canDelete}
        onClick={onStartDelete}
      >
        <DeleteOutline fontSize="small" />
      </IconButton>
    </>
  );
};
