import { createPineColumnHelper } from "@pine/ui";
import {
  IssueActionsTableCell,
  IssueNameTableCell,
  IssuePriorityTableCell,
} from "./IssueListTableCells";
import { type IssueRow } from "./types";

const columnHelper = createPineColumnHelper<IssueRow>();

const buildColumns = (shouldGroup: boolean) => {
  const baseColumns = [
    columnHelper.accessor("name", {
      header: "Name",
      enableGrouping: false,
      cell: ({ row, getValue }) => (
        <IssueNameTableCell issueId={row.original.id} name={getValue()} />
      ),
    }),
    columnHelper.accessor("dueDate", {
      header: "Due Date",
      enableGrouping: false,
      cell: ({ getValue }) => getValue() ?? "",
    }),
    columnHelper.accessor("priority", {
      header: "Priority",
      enableGrouping: false,
      cell: ({ row, getValue }) => (
        <IssuePriorityTableCell issueId={row.original.id} value={getValue()} />
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => <IssueActionsTableCell issueId={row.original.id} />,
    }),
  ];

  if (!shouldGroup) {
    return columnHelper.columns(baseColumns);
  }

  return columnHelper.columns([
    columnHelper.accessor("statusName", {
      header: "Status",
      enableGrouping: true,
    }),
    ...baseColumns,
  ]);
};

export const GROUPED_COLUMNS = buildColumns(true);
export const FLAT_COLUMNS = buildColumns(false);
export const STATUS_GROUPING = ["statusName"];
export const getIssueRowId = (row: IssueRow) => row.id;
