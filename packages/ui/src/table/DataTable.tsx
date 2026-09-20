import {
  type ColumnDef,
  type RowData,
  type TableState,
} from "@tanstack/react-table";
import { DataTableBody } from "./DataTableBody";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableRoot } from "./DataTableRoot";
import { pineTableFeatures, usePineTable } from "./pineTableFeatures";

export type DataTableProps<TData extends RowData> = {
  data: TData[];
  columns: ColumnDef<typeof pineTableFeatures, TData, unknown>[];
  ariaLabel?: string;
  onRowClick?: (row: TData) => void;
  getRowId?: (originalRow: TData, index: number) => string;
  initialState?: Partial<TableState<typeof pineTableFeatures>>;
  showBorder?: boolean;
  groupedColumnMode?: "reorder" | "remove" | false;
};

export const DataTable = <TData extends RowData>({
  data,
  columns,
  ariaLabel,
  onRowClick,
  getRowId,
  initialState,
  showBorder = false,
  groupedColumnMode = "remove",
}: DataTableProps<TData>) => {
  const table = usePineTable(
    {
      data,
      columns,
      getRowId,
      initialState,
      groupedColumnMode,
    },
    (state) => ({
      grouping: state.grouping,
      expanded: state.expanded,
    }),
  );

  const leafColumnCount = table.getAllLeafColumns().length;

  return (
    <DataTableRoot
      table={table}
      leafColumnCount={leafColumnCount}
      ariaLabel={ariaLabel}
      showBorder={showBorder}
    >
      <DataTableHeader />
      <DataTableBody<TData> onRowClick={onRowClick} />
    </DataTableRoot>
  );
};
