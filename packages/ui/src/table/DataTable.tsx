import { Box, useTheme } from "@mui/material";
import {
  type ColumnDef,
  type RowData,
  type TableState,
} from "@tanstack/react-table";
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
  const theme = useTheme();
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
    <Box
      component="table"
      aria-label={ariaLabel}
      sx={{
        width: "100%",
        borderCollapse: "collapse",
        border: showBorder ? `1px solid ${theme.palette.divider}` : "none",
        "& th, & td": {
          borderBottom: `1px solid ${theme.palette.divider}`,
          px: 1,
          py: 0.5,
          textAlign: "left",
          verticalAlign: "middle",
          fontSize: theme.typography.body2.fontSize,
          color: theme.palette.text.primary,
        },
        "& th": {
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.text.secondary,
        },
        "& tbody tr[data-clickable='true']": {
          cursor: "pointer",
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        },
        "& tbody tr[data-grouped='true'] td": {
          backgroundColor: theme.palette.action.hover,
          fontWeight: theme.typography.fontWeightMedium,
        },
      }}
    >
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} colSpan={header.colSpan}>
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <table.Subscribe
        selector={(state) => ({
          grouping: state.grouping,
          expanded: state.expanded,
        })}
      >
        {() => (
          <tbody>
            {table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                return (
                  <tr key={row.id} data-grouped="true">
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
                        <span>{String(row.groupingValue ?? "")}</span>
                        <span>({row.subRows.length})</span>
                      </Box>
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={row.id}
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
            })}
          </tbody>
        )}
      </table.Subscribe>
    </Box>
  );
};
