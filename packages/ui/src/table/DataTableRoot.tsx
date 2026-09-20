import { Box, useTheme, type SxProps, type Theme } from "@mui/material";
import { type ReactNode } from "react";
import { type RowData } from "@tanstack/react-table";
import { DataTableContext } from "./DataTableContext";
import { type PineTableInstance } from "./pineTableFeatures";

export interface DataTableRootProps<TData extends RowData = RowData> {
  table: PineTableInstance<TData>;
  leafColumnCount: number;
  ariaLabel?: string;
  showBorder?: boolean;
  sx?: SxProps<Theme>;
  children: ReactNode;
}

export const DataTableRoot = <TData extends RowData = RowData>({
  table,
  leafColumnCount,
  ariaLabel,
  showBorder = false,
  sx,
  children,
}: DataTableRootProps<TData>) => {
  const theme = useTheme();

  return (
    <table.AppTable>
      <DataTableContext.Provider value={{ leafColumnCount }}>
        <Box
          component="table"
          aria-label={ariaLabel}
          sx={[
            {
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
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          {children}
        </Box>
      </DataTableContext.Provider>
    </table.AppTable>
  );
};
