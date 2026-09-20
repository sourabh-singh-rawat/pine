import {
  type ColumnDef,
  type ExpandedState,
  type RowData,
  type TableState,
  type Updater,
} from "@tanstack/react-table";
import { useCallback, useState } from "react";
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
  grouping?: string[];
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
  grouping,
  showBorder = false,
  groupedColumnMode = "remove",
}: DataTableProps<TData>) => {
  const [expanded, setExpanded] = useState<ExpandedState>(
    () => initialState?.expanded ?? true,
  );

  const handleExpandedChange = useCallback((updater: Updater<ExpandedState>) => {
    setExpanded((previous) => {
      if (typeof updater === "function") {
        return updater(previous);
      }
      return updater;
    });
  }, []);

  const table = usePineTable(
    {
      data,
      columns,
      getRowId,
      initialState,
      groupedColumnMode,
      autoResetAll: false,
      autoResetExpanded: false,
      state: {
        expanded,
        ...(grouping != null ? { grouping } : {}),
      },
      onExpandedChange: handleExpandedChange,
      ...(grouping != null
        ? {
            onGroupingChange: () => {},
          }
        : {}),
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
