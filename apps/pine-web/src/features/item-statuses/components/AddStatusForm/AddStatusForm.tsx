import Add from "@mui/icons-material/Add";
import { Box, Stack, TextField, Typography } from "@mui/material";
import { PrimaryButton, Select } from "@shared";
import { STATUS_TYPE_OPTIONS, type DraftStatus } from "../../utils";

type AddStatusFormProps = {
  draft: DraftStatus;
  isBusy: boolean;
  onChange: (draft: DraftStatus) => void;
  onSubmit: () => void;
};

export const AddStatusForm = ({ draft, isBusy, onChange, onSubmit }: AddStatusFormProps) => {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Add status
      </Typography>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            component="input"
            type="color"
            value={draft.color}
            disabled={isBusy}
            onChange={(event) => {
              onChange({
                ...draft,
                color: event.target.value.toUpperCase(),
              });
            }}
            aria-label="New status color"
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
            value={draft.name}
            disabled={isBusy}
            onChange={(event) => {
              onChange({
                ...draft,
                name: event.target.value,
              });
            }}
          />
        </Stack>
        <Select
          name="create-type"
          label="Type"
          value={draft.type}
          options={STATUS_TYPE_OPTIONS}
          isDisabled={isBusy}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (typeof nextValue !== "string" || !nextValue) {
              return;
            }
            onChange({
              ...draft,
              type: nextValue,
            });
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <PrimaryButton
            label="Add status"
            startIcon={<Add />}
            onClick={onSubmit}
            isDisabled={isBusy}
          />
        </Box>
      </Stack>
    </Box>
  );
};
