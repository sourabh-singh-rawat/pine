import MoreVert from "@mui/icons-material/MoreVert";
import { IconButton } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { createPineColumnHelper, DataTable } from "@pine/ui";
import { useCallback, useContext, useMemo, useState } from "react";
import {
  useDeleteIssueMutation,
  useFindIssueQuery,
  useFindProjectIssuesQuery,
  useFindSubIssuesQuery,
  useUpdateIssueMutation,
} from "@generated/gql";
import { useSnackbar } from "@shared";
import { StatusesContext } from "@shared/contexts/StatusesContext";
import { IssueNameCell } from "./IssueNameCell";
import { IssuePriorityCell } from "./IssuePriorityCell";
import { IssueRowActionsMenu } from "./IssueRowActionsMenu";
import { type IssueListProps, type IssueRow, statusOrderIndex } from "./types";

const EMPTY_ROWS: IssueRow[] = [];

const columnHelper = createPineColumnHelper<IssueRow>();

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
    element: HTMLElement;
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

  const shouldGroup = Boolean(projectId) && statuses.length > 0;

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.accessor("name", {
        header: "Name",
        enableGrouping: false,
        cell: ({ row, getValue }) => {
          const issueKey = row.original.id;
          const current = getValue();
          return (
            <IssueNameCell
              issueId={issueKey}
              name={current}
              isEditing={editingIssueId === issueKey}
              isSaving={updateIssueMutation.isPending}
              onStartEditing={() => setEditingIssueId(issueKey)}
              onFinishEditing={() => {
                setEditingIssueId((currentId) => (currentId === issueKey ? null : currentId));
              }}
              onSave={async (nextName) => handleNameChange(issueKey, nextName)}
            />
          );
        },
      }),
      columnHelper.accessor("dueDate", {
        header: "Due Date",
        enableGrouping: false,
        cell: ({ getValue }) => getValue() ?? "",
      }),
      columnHelper.accessor("priority", {
        header: "Priority",
        enableGrouping: false,
        cell: ({ row, getValue }) => {
          const issueKey = row.original.id;
          const current = priorityOverrides[issueKey] ?? getValue();
          return (
            <IssuePriorityCell
              issueId={issueKey}
              value={current}
              disabled={updateIssueMutation.isPending}
              onChange={(nextPriority) => {
                void handlePriorityChange(issueKey, nextPriority);
              }}
            />
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <IconButton
            size="small"
            aria-label="Issue actions"
            onClick={(event) => {
              event.stopPropagation();
              setMenuAnchor({ element: event.currentTarget, issueId: row.original.id });
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        ),
      }),
    ];

    if (!shouldGroup) {
      return columnHelper.columns(baseColumns);
    }

    return columnHelper.columns([
      columnHelper.accessor("statusName", {
        header: "Status",
        enableGrouping: true,
      }),
      ...baseColumns,
    ]);
  }, [
    editingIssueId,
    handleNameChange,
    handlePriorityChange,
    priorityOverrides,
    shouldGroup,
    updateIssueMutation.isPending,
  ]);

  return (
    <>
      <DataTable
        data={rows.length > 0 ? rows : EMPTY_ROWS}
        columns={columns}
        getRowId={(row) => row.id}
        ariaLabel="Issues"
        showBorder={style?.showBorder}
        initialState={
          shouldGroup
            ? {
                grouping: ["statusName"],
                expanded: true,
              }
            : undefined
        }
      />
      <IssueRowActionsMenu
        anchorEl={menuAnchor?.element ?? null}
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
    </>
  );
};
