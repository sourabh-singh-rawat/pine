import { Box } from "@mui/material";
import { DragDropProvider } from "@dnd-kit/react";
import { Button, DataTable } from "@pine/ui";
import { memo, useMemo, useState } from "react";
import { getItemRowId, SORTABLE_COLUMNS } from "../ItemListColumns";
import { GroupAddItemRow } from "../GroupAddItemRow";
import { ItemListDragContext } from "../ItemListDragContext";
import { SortableItemDataTableRow } from "../SortableItemDataTableRow";
import { type ItemRow } from "../../types";
import { useItemListReorder } from "../../hooks";

const EMPTY_ROWS: ItemRow[] = [];

type ItemStatusGroupSectionProps = {
  listId: string;
  statusId: string;
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
    listId,
    statusId,
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
    const reorder = useItemListReorder({ listId, statusId, rows });
    const displayRows = reorder.displayRows;

    const rootIndexById = useMemo(() => {
      const map = new Map<string, number>();
      displayRows.forEach((row, index) => {
        map.set(row.id, index);
      });
      return map;
    }, [displayRows]);

    const dragContext = useMemo(
      () => ({
        disabled: reorder.isReordering || isLoadingMore,
        rootIndexById,
      }),
      [isLoadingMore, reorder.isReordering, rootIndexById],
    );

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
            <ItemListDragContext.Provider value={dragContext}>
              <DragDropProvider onDragStart={reorder.onDragStart} onDragEnd={reorder.onDragEnd}>
                <DataTable
                  data={displayRows.length > 0 ? displayRows : EMPTY_ROWS}
                  columns={SORTABLE_COLUMNS}
                  getRowId={getItemRowId}
                  getSubRows={enableNestedRows ? getItemSubRows : undefined}
                  ariaLabel={`${statusName} items`}
                  showBorder={showBorder}
                  RowComponent={SortableItemDataTableRow}
                />
              </DragDropProvider>
            </ItemListDragContext.Provider>
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
            <GroupAddItemRow listId={listId} statusId={statusId} />
          </>
        ) : null}
      </Box>
    );
  },
);
