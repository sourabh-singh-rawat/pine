import { createPineColumnHelper } from "@pine/ui";
import { ItemDragHandleCell } from "./ItemDragHandleCell";
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

const statusColumn = columnHelper.display({
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
});

const dragHandleColumn = columnHelper.display({
  id: "drag",
  header: "",
  size: 40,
  minSize: 40,
  maxSize: 40,
  enableGrouping: false,
  cell: ({ row }) => {
    const parentRow = row.getParentRow();
    const isNestedChild = Boolean(parentRow && !parentRow.getIsGrouped());
    if (isNestedChild) {
      return null;
    }
    return <ItemDragHandleCell />;
  },
});

const nameColumn = columnHelper.accessor("name", {
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
});

const dueDateColumn = columnHelper.accessor("dueDate", {
  header: "Due Date",
  size: 140,
  minSize: 120,
  maxSize: 160,
  enableGrouping: false,
  cell: ({ row, getValue }) => <ItemDueDateTableCell itemId={row.original.id} value={getValue()} />,
});

const priorityColumn = columnHelper.accessor("priority", {
  header: "Priority",
  size: 120,
  minSize: 100,
  maxSize: 140,
  enableGrouping: false,
  cell: ({ row, getValue }) => (
    <ItemPriorityTableCell itemId={row.original.id} value={getValue()} />
  ),
});

const tagsColumn = columnHelper.accessor("tags", {
  header: "Tags",
  size: 180,
  minSize: 160,
  maxSize: 220,
  enableGrouping: false,
  cell: ({ row }) => <ItemTagsTableCell itemId={row.original.id} tags={row.original.tags} />,
});

const actionsColumn = columnHelper.display({
  id: "actions",
  header: "",
  size: 48,
  minSize: 48,
  maxSize: 48,
  cell: ({ row }) => <ItemActionsTableCell itemId={row.original.id} />,
});

export const FLAT_COLUMNS = columnHelper.columns([
  statusColumn,
  nameColumn,
  dueDateColumn,
  priorityColumn,
  tagsColumn,
  actionsColumn,
]);

export const SORTABLE_COLUMNS = columnHelper.columns([
  dragHandleColumn,
  statusColumn,
  nameColumn,
  dueDateColumn,
  priorityColumn,
  tagsColumn,
  actionsColumn,
]);

export const getItemRowId = (row: ItemRow) => row.id;
