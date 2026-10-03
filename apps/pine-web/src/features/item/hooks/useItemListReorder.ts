import { move } from "@dnd-kit/helpers";
import { type DragEndEvent } from "@dnd-kit/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useGetListItemsQuery,
  useReorderListItemsMutation,
  type GetListItemsQuery,
} from "@generated/gql";
import { useSnackbar } from "@shared";
import { type ItemRow } from "../types";

export const useItemListReorder = (options: {
  listId: string;
  statusId: string;
  rows: ItemRow[];
}) => {
  const { listId, statusId, rows } = options;
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const reorderMutation = useReorderListItemsMutation();
  const [localRows, setLocalRows] = useState<ItemRow[] | null>(null);
  const isDraggingRef = useRef(false);
  const serverRowsRef = useRef(rows);
  serverRowsRef.current = rows;

  useEffect(() => {
    if (isDraggingRef.current || localRows === null) {
      return;
    }
    const serverIds = rows.map((row) => row.id).join("\0");
    const localIds = localRows.map((row) => row.id).join("\0");
    if (serverIds === localIds) {
      setLocalRows(null);
    }
  }, [localRows, rows]);

  const displayRows = localRows ?? rows;

  const persistReorder = useCallback(
    async (nextRows: ItemRow[]) => {
      try {
        await reorderMutation.mutateAsync({
          input: {
            listId,
            statusId,
            itemIds: nextRows.map((row) => row.id),
          },
        });

        queryClient.setQueryData<GetListItemsQuery>(
          useGetListItemsQuery.getKey({ listId }),
          (current) => {
            if (!current?.getListItems) {
              return current;
            }

            return {
              getListItems: current.getListItems.map((group) => {
                if (group?.status?.id !== statusId) {
                  return group;
                }

                const itemById = new Map(
                  (group.items ?? []).flatMap((item) =>
                    item?.id ? [[item.id, item] as const] : [],
                  ),
                );
                const reordered = nextRows.flatMap((row, index) => {
                  const item = itemById.get(row.id);
                  if (!item) {
                    return [];
                  }
                  return [{ ...item, orderIndex: index }];
                });

                return {
                  ...group,
                  items: reordered,
                };
              }),
            };
          },
        );
      } catch (error) {
        setLocalRows(serverRowsRef.current);
        snackbar.error(error instanceof Error ? error.message : "Failed to reorder items");
      }
    },
    [listId, queryClient, reorderMutation, snackbar, statusId],
  );

  const onDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      isDraggingRef.current = false;
      const currentRows = localRows ?? rows;
      if (event.canceled) {
        setLocalRows(null);
        return;
      }

      const nextRows = move(currentRows, event);
      if (nextRows.every((row, index) => row.id === currentRows[index]?.id)) {
        setLocalRows(null);
        return;
      }

      setLocalRows(nextRows);
      void persistReorder(nextRows);
    },
    [localRows, persistReorder, rows],
  );

  return {
    displayRows,
    isReordering: reorderMutation.isPending,
    onDragStart,
    onDragEnd,
  };
};
