import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  useDeleteIssueMutation,
  useFindIssueQuery,
  useFindProjectIssuesQuery,
  useFindSubIssuesQuery,
  useUpdateIssueMutation,
} from "@generated/gql";
import { useSnackbar } from "@shared";
import type { IssueStatusOverride } from "./IssueListUiContext";

type UseIssueListActionsArgs = {
  issueId?: string;
  projectId?: string;
  statusById: Map<string, string>;
};

export const useIssueListActions = ({
  issueId,
  projectId,
  statusById,
}: UseIssueListActionsArgs) => {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const deleteIssueMutation = useDeleteIssueMutation();
  const updateIssueMutation = useUpdateIssueMutation();
  const [priorityOverrides, setPriorityOverrides] = useState<Record<string, string>>({});
  const [dueDateOverrides, setDueDateOverrides] = useState<
    Record<string, string | null>
  >({});
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, IssueStatusOverride>
  >({});
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});

  const invalidateIssueLists = useCallback(async () => {
    if (projectId) {
      await queryClient.invalidateQueries({
        queryKey: useFindProjectIssuesQuery.getKey({ projectId }),
      });
      await queryClient.invalidateQueries({
        queryKey: ["FindSubIssues"],
      });
    }
    if (issueId) {
      await queryClient.invalidateQueries({
        queryKey: useFindSubIssuesQuery.getKey({ input: { parentIssueId: issueId } }),
      });
    }
  }, [issueId, projectId, queryClient]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const response = await deleteIssueMutation.mutateAsync({ id });
        await invalidateIssueLists();
        snackbar.success(response.deleteIssue ?? "Issue deleted");
      } catch (error) {
        snackbar.error(error instanceof Error ? error.message : "Failed to delete issue");
      }
    },
    [deleteIssueMutation, invalidateIssueLists, snackbar],
  );

  const handlePriorityChange = useCallback(
    async (id: string, priority: string) => {
      setPriorityOverrides((current) => ({ ...current, [id]: priority }));
      try {
        const response = await updateIssueMutation.mutateAsync({
          input: { issueId: id, priority },
        });
        await invalidateIssueLists();
        await queryClient.invalidateQueries({
          queryKey: useFindIssueQuery.getKey({ findIssueId: id }),
        });
        setPriorityOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.success(response.updateIssue ?? "Issue updated");
      } catch (error) {
        setPriorityOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.error(error instanceof Error ? error.message : "Failed to update issue");
      }
    },
    [invalidateIssueLists, queryClient, snackbar, updateIssueMutation],
  );

  const handleNameChange = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      setNameOverrides((current) => ({ ...current, [id]: name }));
      try {
        const response = await updateIssueMutation.mutateAsync({
          input: { issueId: id, name },
        });
        await invalidateIssueLists();
        await queryClient.invalidateQueries({
          queryKey: useFindIssueQuery.getKey({ findIssueId: id }),
        });
        setNameOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.success(response.updateIssue ?? "Issue updated");
        return true;
      } catch (error) {
        setNameOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.error(error instanceof Error ? error.message : "Failed to update issue");
        return false;
      }
    },
    [invalidateIssueLists, queryClient, snackbar, updateIssueMutation],
  );

  const handleDueDateChange = useCallback(
    async (id: string, dueDate: string | null) => {
      setDueDateOverrides((current) => ({ ...current, [id]: dueDate }));
      try {
        const response = await updateIssueMutation.mutateAsync({
          input: { issueId: id, dueDate },
        });
        await invalidateIssueLists();
        await queryClient.invalidateQueries({
          queryKey: useFindIssueQuery.getKey({ findIssueId: id }),
        });
        setDueDateOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.success(response.updateIssue ?? "Issue updated");
      } catch (error) {
        setDueDateOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.error(error instanceof Error ? error.message : "Failed to update issue");
      }
    },
    [invalidateIssueLists, queryClient, snackbar, updateIssueMutation],
  );

  const handleStatusChange = useCallback(
    async (id: string, nextStatusId: string) => {
      const statusName = statusById.get(nextStatusId) ?? "No status";
      setStatusOverrides((current) => ({
        ...current,
        [id]: { statusId: nextStatusId, statusName },
      }));
      try {
        const response = await updateIssueMutation.mutateAsync({
          input: { issueId: id, statusId: nextStatusId },
        });
        await invalidateIssueLists();
        await queryClient.invalidateQueries({
          queryKey: useFindIssueQuery.getKey({ findIssueId: id }),
        });
        setStatusOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.success(response.updateIssue ?? "Issue updated");
      } catch (error) {
        setStatusOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        snackbar.error(error instanceof Error ? error.message : "Failed to update issue");
      }
    },
    [invalidateIssueLists, queryClient, snackbar, statusById, updateIssueMutation],
  );

  return {
    priorityOverrides,
    dueDateOverrides,
    statusOverrides,
    nameOverrides,
    isSaving: updateIssueMutation.isPending,
    handleDelete,
    handlePriorityChange,
    handleNameChange,
    handleDueDateChange,
    handleStatusChange,
  };
};
