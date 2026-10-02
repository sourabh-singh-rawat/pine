import { createPineColumnHelper } from "@pine/ui";
import {
  ItemActionsTableCell,
  ItemDueDateTableCell,
  ItemNameTableCell,
  ItemPriorityTableCell,
  ItemStatusTableCell,
  ItemTagsTableCell,
} from "./ItemListTableCells";
import { type ItemRow } from "./types";

const columnHelper = createPineColumnHelper<ItemRow>();

export const FLAT_COLUMNS = columnHelper.columns([
  columnHelper.display({
    id: "status",
    header: "",
    size: 48,
    minSize: 48,
    maxSize: 48,
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
    size: 480,
    minSize: 200,
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
    size: 140,
    minSize: 120,
    maxSize: 160,
    enableGrouping: false,
    cell: ({ row, getValue }) => (
      <ItemDueDateTableCell itemId={row.original.id} value={getValue()} />
    ),
  }),
  columnHelper.accessor("priority", {
    header: "Priority",
    size: 120,
    minSize: 100,
    maxSize: 140,
    enableGrouping: false,
    cell: ({ row, getValue }) => (
      <ItemPriorityTableCell itemId={row.original.id} value={getValue()} />
    ),
  }),
  columnHelper.accessor("tags", {
    header: "Tags",
    size: 180,
    minSize: 160,
    maxSize: 220,
    enableGrouping: false,
    cell: ({ row }) => <ItemTagsTableCell itemId={row.original.id} tags={row.original.tags} />,
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    size: 48,
    minSize: 48,
    maxSize: 48,
    cell: ({ row }) => <ItemActionsTableCell itemId={row.original.id} />,
  }),
]);

export const getItemRowId = (row: ItemRow) => row.id;
