import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import { Box, Typography, useTheme } from "@mui/material";
import { useGetChecklistsQuery } from "@generated/gql";
import { mapChecklists } from "./mapChecklist";

export interface ItemChecklistCountProps {
  itemId: string;
}

export const ItemChecklistCount = ({ itemId }: ItemChecklistCountProps) => {
  const theme = useTheme();
  const checklistsQuery = useGetChecklistsQuery(
    { itemId },
    {
      enabled: Boolean(itemId),
      select: (data) => mapChecklists(data.getChecklists),
    },
  );

  const checklists = checklistsQuery.data;
  if (!checklists || checklists.length === 0) {
    return null;
  }

  const totals = checklists.reduce(
    (acc, checklist) => {
      acc.completed += checklist.completedCount;
      acc.total += checklist.totalCount;
      return acc;
    },
    { completed: 0, total: 0 },
  );

  if (totals.total === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        color: theme.palette.text.secondary,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      <ChecklistRtlIcon sx={{ fontSize: 16 }} />
      <Typography variant="caption" sx={{ lineHeight: 1 }}>
        {totals.completed}/{totals.total}
      </Typography>
    </Box>
  );
};
