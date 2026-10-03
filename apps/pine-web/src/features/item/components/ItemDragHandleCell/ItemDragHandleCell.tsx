import DragIndicator from "@mui/icons-material/DragIndicator";
import { IconButton } from "@mui/material";
import { useItemSortableRowContext } from "../ItemSortableRowContext";

export const ItemDragHandleCell = () => {
  const sortableRow = useItemSortableRowContext();

  return (
    <IconButton
      ref={sortableRow.handleRef}
      size="small"
      aria-label="Reorder item"
      disabled={sortableRow.disabled}
      sx={{ cursor: sortableRow.disabled ? "default" : "grab", touchAction: "none" }}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <DragIndicator fontSize="small" />
    </IconButton>
  );
};
