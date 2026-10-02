import { Box } from "@mui/material";
import { useSortable } from "@dnd-kit/react/sortable";
import {
  DataTableRow,
  type DataTableRowProps,
  useDataTableContext,
  usePineTableContext,
} from "@pine/ui";
import { useItemListDragContext } from "./ItemListDragContext";
import { ItemSortableRowContext } from "./ItemSortableRowContext";
import { type ItemRow } from "./types";

export const SortableItemDataTableRow = ({ row, onRowClick }: DataTableRowProps<ItemRow>) => {
  const parentRow = row.getParentRow();
  const isNestedChild = Boolean(parentRow && !parentRow.getIsGrouped());

  if (row.getIsGrouped() || isNestedChild) {
    return <DataTableRow row={row} onRowClick={onRowClick} />;
  }

  return <SortableRootItemDataTableRow row={row} onRowClick={onRowClick} />;
};

const SortableRootItemDataTableRow = ({ row, onRowClick }: DataTableRowProps<ItemRow>) => {
  const table = usePineTableContext<ItemRow>();
  useDataTableContext();
  const drag = useItemListDragContext();
  const index = drag.rootIndexById.get(row.original.id) ?? 0;
  const sortable = useSortable({
    id: row.original.id,
    index,
    disabled: drag.disabled,
  });

  const totalSize = table.getTotalSize();
  const rowContext = {
    handleRef: sortable.handleRef,
    disabled: drag.disabled,
  };

  return (
    <Box
      component="tr"
      ref={sortable.ref}
      data-clickable={onRowClick ? "true" : undefined}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      sx={{
        opacity: sortable.isDragging ? 0.5 : 1,
      }}
    >
      {row.getAllCells().map((cell) => {
        const size = cell.column.getSize();
        const widthPercent = totalSize > 0 ? (size / totalSize) * 100 : undefined;
        return (
          <td
            key={cell.id}
            style={widthPercent == null ? undefined : { width: `${widthPercent}%` }}
          >
            <ItemSortableRowContext.Provider value={rowContext}>
              <table.FlexRender cell={cell} />
            </ItemSortableRowContext.Provider>
          </td>
        );
      })}
    </Box>
  );
};
