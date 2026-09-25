import { Box } from "@mui/material";
import { type Row, type RowData } from "@tanstack/react-table";
import { useDataTableContext } from "./DataTableContext";
import { usePineTableContext, type PineTableFeatures } from "./pineTableFeatures";

export interface DataTableRowProps<TData extends RowData = RowData> {
  row: Row<PineTableFeatures, TData>;
  onRowClick?: (row: TData) => void;
}

export const DataTableRow = <TData extends RowData = RowData>({
  row,
  onRowClick,
}: DataTableRowProps<TData>) => {
  const table = usePineTableContext<TData>();
  const { leafColumnCount } = useDataTableContext();

  if (row.getIsGrouped()) {
    const rawValue = row.groupingValue;
    const displayValue =
      typeof rawValue === "string" || typeof rawValue === "number" ? `${rawValue}` : "";

    return (
      <tr data-grouped="true">
        <td colSpan={leafColumnCount}>
          <Box
            component="button"
            type="button"
            onClick={row.getToggleExpandedHandler()}
            sx={{
              all: "unset",
              cursor: row.getCanExpand() ? "pointer" : "default",
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              py: 0.5,
            }}
          >
            <span aria-hidden>{row.getIsExpanded() ? "▾" : "▸"}</span>
            <span>{displayValue}</span>
            <span>({row.subRows.length})</span>
          </Box>
        </td>
      </tr>
    );
  }

  return (
    <tr
      data-clickable={onRowClick ? "true" : undefined}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
    >
      {row.getAllCells().map((cell) => (
        <td key={cell.id}>
          <table.FlexRender cell={cell} />
        </td>
      ))}
    </tr>
  );
};
