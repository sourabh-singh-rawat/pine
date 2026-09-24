import { type RowData } from "@tanstack/react-table";
import { DataTableRow } from "./DataTableRow";
import { usePineTableContext } from "./pineTableFeatures";

export interface DataTableBodyProps<TData extends RowData = RowData> {
  onRowClick?: (row: TData) => void;
}

export const DataTableBody = <TData extends RowData = RowData>({
  onRowClick,
}: DataTableBodyProps<TData> = {}) => {
  const table = usePineTableContext<TData>();

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
            <DataTableRow<TData>
              key={row.id}
              row={row}
              onRowClick={onRowClick}
            />
          ))}
        </tbody>
      )}
    </table.Subscribe>
  );
};
