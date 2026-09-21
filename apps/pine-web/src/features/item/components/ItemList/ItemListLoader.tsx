import { Box } from "@mui/material";
import { ProgressCircularIndicator } from "@pine/ui";

export const ItemListLoader = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 160,
      width: "100%",
    }}
  >
    <ProgressCircularIndicator size={40} aria-label="Loading items" />
  </Box>
);
