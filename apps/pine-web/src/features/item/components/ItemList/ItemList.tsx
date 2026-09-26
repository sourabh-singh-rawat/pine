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
import { buildItemListGroups } from "./buildItemListGroups";
import { ItemRowActionsMenu } from "./ItemRowActionsMenu";
import { FLAT_COLUMNS, getItemRowId } from "./ItemListColumns";
import { ItemListLoader } from "./ItemListLoader";
import { ItemListUiContext, type ItemListUiContextValue } from "./ItemListUiContext";
import { ItemStatusGroupSection } from "./ItemStatusGroupSection";
import { sortItemRows, toItemRow } from "./mapItemRow";
import { type ItemListProps, type ItemRow } from "./types";
import { useItemListActions } from "./useItemListActions";
import { useItemListNesting } from "./useItemListNesting";

const EMPTY_ROWS: ItemRow[] = [];

type ItemListTableProps = {
  rows: ItemRow[];
  columns: ColumnDef<PineTableFeatures, ItemRow, unknown>[];
  enableNestedRows: boolean;
  showBorder?: boolean;
};

const getItemSubRows = (row: ItemRow) => row.children;

const ItemListTable = memo(
  ({ rows, columns, enableNestedRows, showBorder }: ItemListTableProps) => (
    <DataTable
      data={rows.length > 0 ? rows : EMPTY_ROWS}
      columns={columns}
      getRowId={getItemRowId}
      getSubRows={enableNestedRows ? getItemSubRows : undefined}
      ariaLabel="Items"
      showBorder={showBorder}
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

  const groups = useMemo(() => {
    if (itemId || !listId) {
      return null;
    }
    return buildItemListGroups({
      sourceGroups: listItems.data ?? [],
      statusById,
      statusOverrides,
      nameOverrides,
      expandedParentIds,
      enableNestedRows,
      childrenByParentId,
    });
  }, [
    childrenByParentId,
    enableNestedRows,
    expandedParentIds,
    itemId,
    listId,
    listItems.data,
    nameOverrides,
    statusById,
    statusOverrides,
  ]);

  const flatRows = useMemo((): ItemRow[] => {
    if (!itemId) {
      return EMPTY_ROWS;
    }
    const source = subItems.data ?? [];
    const mapped = source.flatMap((item) => {
      if (!item) {
        return [];
      }
      const row = toItemRow(item, {
        statusById,
        statusOverrides,
        nameOverrides,
      });
      return row ? [row] : [];
    });
    return sortItemRows(mapped);
  }, [itemId, nameOverrides, statusById, statusOverrides, subItems.data]);

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
        {groups ? (
          groups.map((group) => (
            <ItemStatusGroupSection
              key={group.statusId}
              statusName={group.statusName}
              rows={group.rows}
              enableNestedRows={enableNestedRows}
              showBorder={style?.showBorder}
            />
          ))
        ) : (
          <ItemListTable
            rows={flatRows}
            columns={FLAT_COLUMNS}
            enableNestedRows={false}
            showBorder={style?.showBorder}
          />
        )}
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
