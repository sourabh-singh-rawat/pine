import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  useDeleteItemMutation,
  useGetItemQuery,
  useGetListItemsQuery,
  useGetSubItemsQuery,
  useUpdateItemMutation,
} from "@generated/gql";
import { useSnackbar } from "@shared";
import type { ItemStatusOverride } from "./ItemListUiContext";

type UseItemListActionsArgs = {
  itemId?: string;
  listId?: string;
  statusById: Map<string, string>;
};

export const useItemListActions = ({ itemId, listId, statusById }: UseItemListActionsArgs) => {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const deleteItemMutation = useDeleteItemMutation();
  const updateItemMutation = useUpdateItemMutation();
  const [priorityOverrides, setPriorityOverrides] = useState<Record<string, string>>({});
  const [dueDateOverrides, setDueDateOverrides] = useState<Record<string, string | null>>({});
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ItemStatusOverride>>({});
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});

  const invalidateItemLists = useCallback(async () => {
    if (listId) {
      await queryClient.invalidateQueries({
        queryKey: useGetListItemsQuery.getKey({ listId }),
      });
      await queryClient.invalidateQueries({
        queryKey: ["GetSubItems"],
      });
    }
    if (itemId) {
      await queryClient.invalidateQueries({
        queryKey: useGetSubItemsQuery.getKey({ input: { parentItemId: itemId } }),
      });
    }
  }, [itemId, listId, queryClient]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const response = await deleteItemMutation.mutateAsync({ id });
        await invalidateItemLists();
        snackbar.success(response.deleteItem ?? "Item deleted");
      } catch (error) {
        snackbar.error(error instanceof Error ? error.message : "Failed to delete item");
      }
    },
    [deleteItemMutation, invalidateItemLists, snackbar],
  );

  const handlePriorityChange = useCallback(
    async (id: string, priority: string) => {
      setPriorityOverrides((current) => ({ ...current, [id]: priority }));
      try {
        const response = await updateItemMutation.mutateAsync({
          input: { itemId: id, priority },
        });
        await invalidateItemLists();
        await queryClient.invalidateQueries({
          queryKey: useGetItemQuery.getKey({ id: id }),
        });
        setPriorityOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.success(response.updateItem ?? "Item updated");
      } catch (error) {
        setPriorityOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.error(error instanceof Error ? error.message : "Failed to update item");
      }
    },
    [invalidateItemLists, queryClient, snackbar, updateItemMutation],
  );

  const handleNameChange = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      setNameOverrides((current) => ({ ...current, [id]: name }));
      try {
        const response = await updateItemMutation.mutateAsync({
          input: { itemId: id, name },
        });
        await invalidateItemLists();
        await queryClient.invalidateQueries({
          queryKey: useGetItemQuery.getKey({ id: id }),
        });
        setNameOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.success(response.updateItem ?? "Item updated");
        return true;
      } catch (error) {
        setNameOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.error(error instanceof Error ? error.message : "Failed to update item");
        return false;
      }
    },
    [invalidateItemLists, queryClient, snackbar, updateItemMutation],
  );

  const handleDueDateChange = useCallback(
    async (id: string, dueDate: string | null) => {
      setDueDateOverrides((current) => ({ ...current, [id]: dueDate }));
      try {
        const response = await updateItemMutation.mutateAsync({
          input: { itemId: id, dueDate },
        });
        await invalidateItemLists();
        await queryClient.invalidateQueries({
          queryKey: useGetItemQuery.getKey({ id: id }),
        });
        setDueDateOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.success(response.updateItem ?? "Item updated");
      } catch (error) {
        setDueDateOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.error(error instanceof Error ? error.message : "Failed to update item");
      }
    },
    [invalidateItemLists, queryClient, snackbar, updateItemMutation],
  );

  const handleStatusChange = useCallback(
    async (id: string, nextStatusId: string) => {
      const statusName = statusById.get(nextStatusId) ?? "No status";
      setStatusOverrides((current) => ({
        ...current,
        [id]: { statusId: nextStatusId, statusName },
      }));
      try {
        const response = await updateItemMutation.mutateAsync({
          input: { itemId: id, statusId: nextStatusId },
        });
        await invalidateItemLists();
        await queryClient.invalidateQueries({
          queryKey: useGetItemQuery.getKey({ id: id }),
        });
        setStatusOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.success(response.updateItem ?? "Item updated");
      } catch (error) {
        setStatusOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.error(error instanceof Error ? error.message : "Failed to update item");
      }
    },
    [invalidateItemLists, queryClient, snackbar, statusById, updateItemMutation],
  );

  return {
    priorityOverrides,
    dueDateOverrides,
    statusOverrides,
    nameOverrides,
    isSaving: updateItemMutation.isPending,
    handleDelete,
    handlePriorityChange,
    handleNameChange,
    handleDueDateChange,
    handleStatusChange,
  };
};
