import { type RowData } from "@tanstack/react-table";
import { type ComponentType } from "react";
import { DataTableRow, type DataTableRowProps } from "./DataTableRow";
import { usePineTableContext } from "./pineTableFeatures";

export interface DataTableBodyProps<TData extends RowData = RowData> {
  onRowClick?: (row: TData) => void;
  RowComponent?: ComponentType<DataTableRowProps<TData>>;
}

export const DataTableBody = <TData extends RowData = RowData>({
  onRowClick,
  RowComponent,
}: DataTableBodyProps<TData> = {}) => {
  const table = usePineTableContext<TData>();
  const Row = RowComponent ?? DataTableRow;

  return (
    <table.Subscribe
      selector={(state) => ({
        grouping: state.grouping,
        expanded: state.expanded,
      })}
    >
      {() => (
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <Row key={row.id} row={row} onRowClick={onRowClick} />
          ))}
        </tbody>
      )}
    </table.Subscribe>
  );
};
