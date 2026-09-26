import { Box } from "@mui/material";
import { DataTable } from "@pine/ui";
import { memo, useState } from "react";
import { FLAT_COLUMNS, getItemRowId } from "./ItemListColumns";
import { type ItemRow } from "./types";

const EMPTY_ROWS: ItemRow[] = [];

type ItemStatusGroupSectionProps = {
  statusName: string;
  rows: ItemRow[];
  enableNestedRows: boolean;
  showBorder?: boolean;
  defaultExpanded?: boolean;
};

const getItemSubRows = (row: ItemRow) => row.children;

export const ItemStatusGroupSection = memo(
  ({
    statusName,
    rows,
    enableNestedRows,
    showBorder,
    defaultExpanded = true,
  }: ItemStatusGroupSectionProps) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
      <Box sx={{ mb: 1.5 }}>
        <Box
          component="button"
          type="button"
          onClick={() => {
            setExpanded((current) => !current);
          }}
          sx={{
            all: "unset",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            py: 0.5,
            mb: 0.5,
          }}
        >
          <span aria-hidden>{expanded ? "▾" : "▸"}</span>
          <span>{statusName}</span>
          <span>({rows.length})</span>
        </Box>
        {expanded ? (
          <DataTable
            data={rows.length > 0 ? rows : EMPTY_ROWS}
            columns={FLAT_COLUMNS}
            getRowId={getItemRowId}
            getSubRows={enableNestedRows ? getItemSubRows : undefined}
            ariaLabel={`${statusName} items`}
            showBorder={showBorder}
          />
        ) : null}
      </Box>
    );
  },
);
