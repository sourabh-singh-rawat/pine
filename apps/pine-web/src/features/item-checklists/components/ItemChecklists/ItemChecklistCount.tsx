import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import { Box, Typography, useTheme } from "@mui/material";

export interface ItemChecklistCountProps {
  completedCount: number;
  totalCount: number;
}

export const ItemChecklistCount = ({ completedCount, totalCount }: ItemChecklistCountProps) => {
  const theme = useTheme();

  if (totalCount === 0) {
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
        {completedCount}/{totalCount}
      </Typography>
    </Box>
  );
};
