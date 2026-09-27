import { createPineColumnHelper } from "@pine/ui";
import {
  ItemActionsTableCell,
  ItemDueDateTableCell,
  ItemNameTableCell,
  ItemPriorityTableCell,
  ItemStatusTableCell,
} from "./ItemListTableCells";
import { type ItemRow } from "./types";

const columnHelper = createPineColumnHelper<ItemRow>();

export const FLAT_COLUMNS = columnHelper.columns([
  columnHelper.display({
    id: "status",
    header: "",
    enableGrouping: false,
    cell: ({ row }) => (
      <ItemStatusTableCell
        itemId={row.original.id}
        statusId={row.original.statusId}
        statusName={row.original.statusName}
      />
    ),
  }),
  columnHelper.accessor("name", {
    header: "Name",
    enableGrouping: false,
    cell: ({ row, getValue }) => {
      const parentRow = row.getParentRow();
      const isNestedChild = Boolean(parentRow && !parentRow.getIsGrouped());
      return (
        <ItemNameTableCell
          itemId={row.original.id}
          name={getValue()}
          depth={isNestedChild ? 1 : 0}
          hasChildren={row.original.hasChildren}
          isExpanded={row.original.isNestedExpanded}
          checklistCompletedCount={row.original.checklistCompletedCount}
          checklistTotalCount={row.original.checklistTotalCount}
        />
      );
    },
  }),
  columnHelper.accessor("dueDate", {
    header: "Due Date",
    enableGrouping: false,
    cell: ({ row, getValue }) => (
      <ItemDueDateTableCell itemId={row.original.id} value={getValue()} />
    ),
  }),
  columnHelper.accessor("priority", {
    header: "Priority",
    enableGrouping: false,
    cell: ({ row, getValue }) => (
      <ItemPriorityTableCell itemId={row.original.id} value={getValue()} />
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <ItemActionsTableCell itemId={row.original.id} />,
  }),
]);

export const getItemRowId = (row: ItemRow) => row.id;
