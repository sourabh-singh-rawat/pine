import { Box } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { Select } from "@shared";

export interface IssuePriorityCellProps {
  issueId: string;
  value: string;
  disabled?: boolean;
  onChange: (priority: string) => void;
}

const PRIORITY_OPTIONS = ["Urgent", "High", "Normal", "Low"];

const prioritySelectOptions = PRIORITY_OPTIONS.map((option) => ({
  id: option,
  name: option,
}));

export const IssuePriorityCell = ({
  issueId,
  value,
  disabled,
  onChange,
}: IssuePriorityCellProps) => {
  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const next = event.target.value;
    if (typeof next !== "string" || !next || next === value) return;
    onChange(next);
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
      <Select
        name={`priority-${issueId}`}
        value={value}
        variant="small"
        options={prioritySelectOptions}
        isDisabled={disabled}
        onChange={handleChange}
      />
    </Box>
  );
};
