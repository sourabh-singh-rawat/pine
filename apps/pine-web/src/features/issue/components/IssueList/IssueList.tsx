import { Box } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import {
  DataTable,
  type ColumnDef,
  type MenuAnchorPosition,
  type PineTableFeatures,
} from "@pine/ui";
import { memo, useCallback, useContext, useMemo, useState } from "react";
import {
  useDeleteIssueMutation,
  useFindIssueQuery,
  useFindProjectIssuesQuery,
  useFindSubIssuesQuery,
  useUpdateIssueMutation,
} from "@generated/gql";
import { useSnackbar } from "@shared";
import { StatusesContext } from "@shared/contexts/StatusesContext";
import { IssueRowActionsMenu } from "./IssueRowActionsMenu";
import {
  FLAT_COLUMNS,
  getIssueRowId,
  GROUPED_COLUMNS,
  STATUS_GROUPING,
} from "./IssueListColumns";
import { IssueListLoader } from "./IssueListLoader";
import {
  IssueListUiContext,
  type IssueListUiContextValue,
} from "./IssueListUiContext";
import { type IssueListProps, type IssueRow, statusOrderIndex } from "./types";

const EMPTY_ROWS: IssueRow[] = [];

type IssueListTableProps = {
  rows: IssueRow[];
  columns: ColumnDef<PineTableFeatures, IssueRow, unknown>[];
  shouldGroup: boolean;
  showBorder?: boolean;
};

const IssueListTable = memo(
  ({ rows, columns, shouldGroup, showBorder }: IssueListTableProps) => (
    <DataTable
      data={rows.length > 0 ? rows : EMPTY_ROWS}
      columns={columns}
      getRowId={getIssueRowId}
      ariaLabel="Issues"
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

export const IssueList = ({ issueId, projectId, style }: IssueListProps) => {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const { statuses } = useContext(StatusesContext);
  const deleteIssueMutation = useDeleteIssueMutation();
  const updateIssueMutation = useUpdateIssueMutation();
  const [priorityOverrides, setPriorityOverrides] = useState<Record<string, string>>({});
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    position: MenuAnchorPosition;
    issueId: string;
  } | null>(null);

  const projectIssues = useFindProjectIssuesQuery(
    { projectId: projectId! },
    {
      select: (data) => data.findProjectIssues,
      enabled: Boolean(projectId) && !issueId,
    },
  );
  const subIssues = useFindSubIssuesQuery(
    { input: { parentIssueId: issueId! } },
    {
      select: (data) => data.findSubIssues,
      enabled: Boolean(issueId),
    },
  );

  const issuesQuery = issueId ? subIssues : projectIssues;
  const isIssuesLoading = issuesQuery.isPending;

  const statusById = useMemo(() => {
    const map = new Map<string, string>();
    for (const status of statuses) {
      map.set(status.id, status.name);
    }
    return map;
  }, [statuses]);

  const rows = useMemo((): IssueRow[] => {
    const source = issueId ? (subIssues.data ?? []) : (projectIssues.data ?? []);
    const mapped = source.flatMap((issue) => {
      if (!issue?.id || !issue.name) return [];
      const statusId =
        "statusId" in issue && typeof issue.statusId === "string" ? issue.statusId : "";
      const statusName = statusById.get(statusId) ?? "No status";
      const priority =
        "priority" in issue && typeof issue.priority === "string" ? issue.priority : "";
      const name = nameOverrides[issue.id] ?? issue.name;
      return [
        {
          id: issue.id,
          name,
          statusId,
          statusName,
          statusOrder: statusOrderIndex(statusName),
          priority,
          dueDate: null,
        },
      ];
    });

    return mapped.slice().sort((a, b) => {
      if (a.statusOrder !== b.statusOrder) return a.statusOrder - b.statusOrder;
      return a.name.localeCompare(b.name);
    });
  }, [issueId, nameOverrides, projectIssues.data, subIssues.data, statusById]);

  const invalidateIssueLists = useCallback(async () => {
    if (projectId) {
      await queryClient.invalidateQueries({
        queryKey: useFindProjectIssuesQuery.getKey({ projectId }),
      });
    }
    if (issueId) {
      await queryClient.invalidateQueries({
        queryKey: useFindSubIssuesQuery.getKey({ input: { parentIssueId: issueId } }),
      });
    }
  }, [issueId, projectId, queryClient]);

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteIssueMutation.mutateAsync({ id });
      await invalidateIssueLists();
      snackbar.success(response.deleteIssue ?? "Issue deleted");
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to delete issue");
    }
  };

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

  const onStartEditing = useCallback((id: string) => {
    setEditingIssueId(id);
  }, []);

  const onFinishEditing = useCallback((id: string) => {
    setEditingIssueId((currentId) => (currentId === id ? null : currentId));
  }, []);

  const onOpenMenu = useCallback((id: string, position: MenuAnchorPosition) => {
    setMenuAnchor({ position, issueId: id });
  }, []);

  const onPriorityChange = useCallback(
    (id: string, priority: string) => {
      void handlePriorityChange(id, priority);
    },
    [handlePriorityChange],
  );

  const uiValue = useMemo(
    (): IssueListUiContextValue => ({
      editingIssueId,
      priorityOverrides,
      isSaving: updateIssueMutation.isPending,
      onStartEditing,
      onFinishEditing,
      onSaveName: handleNameChange,
      onPriorityChange,
      onOpenMenu,
    }),
    [
      editingIssueId,
      handleNameChange,
      onFinishEditing,
      onOpenMenu,
      onPriorityChange,
      onStartEditing,
      priorityOverrides,
      updateIssueMutation.isPending,
    ],
  );

  const shouldGroup = Boolean(projectId);
  const columns = shouldGroup ? GROUPED_COLUMNS : FLAT_COLUMNS;

  if (isIssuesLoading) {
    return <IssueListLoader />;
  }

  return (
    <IssueListUiContext.Provider value={uiValue}>
      <Box sx={{ scrollbarGutter: "stable" }}>
        <IssueListTable
          key={shouldGroup ? "grouped" : "flat"}
          rows={rows}
          columns={columns}
          shouldGroup={shouldGroup}
          showBorder={style?.showBorder}
        />
      </Box>
      <IssueRowActionsMenu
        anchorPosition={menuAnchor?.position ?? null}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        onRename={() => {
          const id = menuAnchor?.issueId;
          setMenuAnchor(null);
          if (id) setEditingIssueId(id);
        }}
        onDelete={() => {
          const id = menuAnchor?.issueId;
          setMenuAnchor(null);
          if (id) void handleDelete(id);
        }}
      />
    </IssueListUiContext.Provider>
  );
};
