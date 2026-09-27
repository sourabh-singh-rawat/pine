import { Box } from "@mui/material";
import { Button, DataTable } from "@pine/ui";
import { memo, useState } from "react";
import { FLAT_COLUMNS, getItemRowId } from "./ItemListColumns";
import { type ItemRow } from "./types";

const EMPTY_ROWS: ItemRow[] = [];

type ItemStatusGroupSectionProps = {
  statusName: string;
  rows: ItemRow[];
  totalCount: number;
  enableNestedRows: boolean;
  showBorder?: boolean;
  defaultExpanded?: boolean;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
};

const getItemSubRows = (row: ItemRow) => row.children;

export const ItemStatusGroupSection = memo(
  ({
    statusName,
    rows,
    totalCount,
    enableNestedRows,
    showBorder,
    defaultExpanded = true,
    hasNextPage = false,
    isLoadingMore = false,
    onLoadMore,
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
          <span>({totalCount})</span>
        </Box>
        {expanded ? (
          <>
            <DataTable
              data={rows.length > 0 ? rows : EMPTY_ROWS}
              columns={FLAT_COLUMNS}
              getRowId={getItemRowId}
              getSubRows={enableNestedRows ? getItemSubRows : undefined}
              ariaLabel={`${statusName} items`}
              showBorder={showBorder}
            />
            {hasNextPage && onLoadMore ? (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                <Button
                  label={isLoadingMore ? "Loading…" : "Load more"}
                  variant="text"
                  size="small"
                  isDisabled={isLoadingMore}
                  onClick={onLoadMore}
                />
              </Box>
            ) : null}
          </>
        ) : null}
      </Box>
    );
  },
);
