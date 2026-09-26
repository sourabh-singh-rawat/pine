import DragIndicator from "@mui/icons-material/DragIndicator";
import { Box, IconButton, Stack } from "@mui/material";
import { useSortable } from "@dnd-kit/react/sortable";
import type { ReactNode } from "react";

type SortableStatusCardProps = {
  id: string;
  index: number;
  name: string;
  disabled: boolean;
  showHandle: boolean;
  children: ReactNode;
};

export const SortableStatusCard = ({
  id,
  index,
  name,
  disabled,
  showHandle,
  children,
}: SortableStatusCardProps) => {
  const sortable = useSortable({
    id,
    index,
    disabled,
  });

  return (
    <Box
      ref={sortable.ref}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
        opacity: sortable.isDragging ? 0.5 : 1,
        bgcolor: "background.paper",
      }}
    >
      {showHandle ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            ref={sortable.handleRef}
            size="small"
            aria-label={`Reorder ${name}`}
            disabled={disabled}
            sx={{ cursor: disabled ? "default" : "grab", touchAction: "none" }}
          >
            <DragIndicator fontSize="small" />
          </IconButton>
          {children}
        </Stack>
      ) : (
        children
      )}
    </Box>
  );
};
