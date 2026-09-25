import { Box } from "@mui/material";
import {
  DataTable,
  type ColumnDef,
  type MenuAnchorPosition,
  type PineTableFeatures,
} from "@pine/ui";
import { memo, useCallback, useContext, useMemo, useState } from "react";
import { useGetListItemsQuery, useGetSubItemsQuery } from "@generated/gql";
import { StatusesContext } from "@shared/contexts/StatusesContext";
import { ItemRowActionsMenu } from "./ItemRowActionsMenu";
import { FLAT_COLUMNS, getItemRowId, GROUPED_COLUMNS, STATUS_GROUPING } from "./ItemListColumns";
import { ItemListLoader } from "./ItemListLoader";
import { ItemListUiContext, type ItemListUiContextValue } from "./ItemListUiContext";
import { sortItemRows, toItemRow } from "./mapItemRow";
import { type ItemListProps, type ItemRow } from "./types";
import { useItemListActions } from "./useItemListActions";
import { useItemListNesting } from "./useItemListNesting";

const EMPTY_ROWS: ItemRow[] = [];

type ItemListTableProps = {
  rows: ItemRow[];
  columns: ColumnDef<PineTableFeatures, ItemRow, unknown>[];
  shouldGroup: boolean;
  enableNestedRows: boolean;
  showBorder?: boolean;
};

const getItemSubRows = (row: ItemRow) => row.children;

const ItemListTable = memo(
  ({ rows, columns, shouldGroup, enableNestedRows, showBorder }: ItemListTableProps) => (
    <DataTable
      data={rows.length > 0 ? rows : EMPTY_ROWS}
      columns={columns}
      getRowId={getItemRowId}
      getSubRows={enableNestedRows ? getItemSubRows : undefined}
      ariaLabel="Items"
      showBorder={showBorder}
      grouping={shouldGroup ? STATUS_GROUPING : undefined}
      initialState={
        shouldGroup
          ? {
              grouping: STATUS_GROUPING,
              expanded: true,
            }
          : undefined
      }
    />
  ),
);

export const ItemList = ({ itemId, listId, style }: ItemListProps) => {
  const { statuses } = useContext(StatusesContext);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    position: MenuAnchorPosition;
    itemId: string;
  } | null>(null);

  const enableNestedRows = Boolean(listId) && !itemId;

  const listItems = useGetListItemsQuery(
    { listId: listId! },
    {
      select: (data) => data.getListItems,
      enabled: Boolean(listId) && !itemId,
    },
  );
  const subItems = useGetSubItemsQuery(
    { input: { parentItemId: itemId! } },
    {
      select: (data) => data.getSubItems,
      enabled: Boolean(itemId),
    },
  );

  const itemsQuery = itemId ? subItems : listItems;
  const isItemsLoading = itemsQuery.isPending;

  const statusById = useMemo(() => {
    const map = new Map<string, string>();
    for (const status of statuses) {
      map.set(status.id, status.name);
    }
    return map;
  }, [statuses]);

  const {
    priorityOverrides,
    dueDateOverrides,
    statusOverrides,
    nameOverrides,
    isSaving,
    handleDelete,
    handlePriorityChange,
    handleNameChange,
    handleDueDateChange,
    handleStatusChange,
  } = useItemListActions({ itemId, listId, statusById });

  const { childrenByParentId, expandedParentIds, expandingItemIds, onToggleNestedItem } =
    useItemListNesting({
      enabled: enableNestedRows,
      listDataUpdatedAt: listItems.dataUpdatedAt,
    });

  const rows = useMemo((): ItemRow[] => {
    const source = itemId ? (subItems.data ?? []) : (listItems.data ?? []);
    const mapped = source.flatMap((item) => {
      if (!item) return [];
      const isOpen = enableNestedRows && item.id ? expandedParentIds.has(item.id) : false;
      const childSources = isOpen && item.id ? childrenByParentId[item.id] : undefined;
      const children =
        childSources === undefined
          ? undefined
          : sortItemRows(
              childSources.flatMap((child) => {
                const childRow = toItemRow(child, {
                  statusById,
                  statusOverrides,
                  nameOverrides,
                });
                return childRow ? [childRow] : [];
              }),
            );
      const row = toItemRow(item, {
        statusById,
        statusOverrides,
        nameOverrides,
        isNestedExpanded: isOpen,
        children,
      });
      return row ? [row] : [];
    });

    return sortItemRows(mapped);
  }, [
    childrenByParentId,
    enableNestedRows,
    expandedParentIds,
    itemId,
    nameOverrides,
    listItems.data,
    statusById,
    statusOverrides,
    subItems.data,
  ]);

  const onStartEditing = useCallback((id: string) => {
    setEditingItemId(id);
  }, []);

  const onFinishEditing = useCallback((id: string) => {
    setEditingItemId((currentId) => (currentId === id ? null : currentId));
  }, []);

  const onOpenMenu = useCallback((id: string, position: MenuAnchorPosition) => {
    setMenuAnchor({ position, itemId: id });
  }, []);

  const onPriorityChange = useCallback(
    (id: string, priority: string) => {
      void handlePriorityChange(id, priority);
    },
    [handlePriorityChange],
  );

  const onDueDateChange = useCallback(
    (id: string, dueDate: string | null) => {
      void handleDueDateChange(id, dueDate);
    },
    [handleDueDateChange],
  );

  const onStatusChange = useCallback(
    (id: string, nextStatusId: string) => {
      void handleStatusChange(id, nextStatusId);
    },
    [handleStatusChange],
  );

  const shouldGroup = Boolean(listId);
  const columns = shouldGroup ? GROUPED_COLUMNS : FLAT_COLUMNS;

  const uiValue = useMemo(
    (): ItemListUiContextValue => ({
      editingItemId,
      priorityOverrides,
      dueDateOverrides,
      statuses,
      isSaving,
      showExpandGutter: enableNestedRows,
      expandingItemIds,
      onStartEditing,
      onFinishEditing,
      onSaveName: handleNameChange,
      onPriorityChange,
      onDueDateChange,
      onStatusChange,
      onOpenMenu,
      onToggleNestedItem,
    }),
    [
      dueDateOverrides,
      editingItemId,
      enableNestedRows,
      expandingItemIds,
      handleNameChange,
      isSaving,
      onDueDateChange,
      onFinishEditing,
      onOpenMenu,
      onPriorityChange,
      onStartEditing,
      onStatusChange,
      onToggleNestedItem,
      priorityOverrides,
      statuses,
    ],
  );

  if (isItemsLoading) {
    return <ItemListLoader />;
  }

  return (
    <ItemListUiContext.Provider value={uiValue}>
      <Box sx={{ scrollbarGutter: "stable" }}>
        <ItemListTable
          key={shouldGroup ? "grouped" : "flat"}
          rows={rows}
          columns={columns}
          shouldGroup={shouldGroup}
          enableNestedRows={enableNestedRows}
          showBorder={style?.showBorder}
        />
      </Box>
      <ItemRowActionsMenu
        anchorPosition={menuAnchor?.position ?? null}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        onRename={() => {
          const id = menuAnchor?.itemId;
          setMenuAnchor(null);
          if (id) setEditingItemId(id);
        }}
        onDelete={() => {
          const id = menuAnchor?.itemId;
          setMenuAnchor(null);
          if (id) void handleDelete(id);
        }}
      />
    </ItemListUiContext.Provider>
  );
};
