import { Box } from "@mui/material";
import {
  DataTable,
  type ColumnDef,
  type MenuAnchorPosition,
  type PineTableFeatures,
} from "@pine/ui";
import { memo, useCallback, useContext, useMemo, useState } from "react";
import {
  useFindProjectIssuesQuery,
  useFindSubIssuesQuery,
} from "@generated/gql";
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
import { sortIssueRows, toIssueRow } from "./mapIssueRow";
import { type IssueListProps, type IssueRow } from "./types";
import { useIssueListActions } from "./useIssueListActions";
import { useIssueListNesting } from "./useIssueListNesting";

const EMPTY_ROWS: IssueRow[] = [];

type IssueListTableProps = {
  rows: IssueRow[];
  columns: ColumnDef<PineTableFeatures, IssueRow, unknown>[];
  shouldGroup: boolean;
  enableNestedRows: boolean;
  showBorder?: boolean;
};

const getIssueSubRows = (row: IssueRow) => row.children;

const IssueListTable = memo(
  ({
    rows,
    columns,
    shouldGroup,
    enableNestedRows,
    showBorder,
  }: IssueListTableProps) => (
    <DataTable
      data={rows.length > 0 ? rows : EMPTY_ROWS}
      columns={columns}
      getRowId={getIssueRowId}
      getSubRows={enableNestedRows ? getIssueSubRows : undefined}
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
  const { statuses } = useContext(StatusesContext);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    position: MenuAnchorPosition;
    issueId: string;
  } | null>(null);

  const enableNestedRows = Boolean(projectId) && !issueId;

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
  } = useIssueListActions({ issueId, projectId, statusById });

  const {
    childrenByParentId,
    expandedParentIds,
    expandingIssueIds,
    onToggleNestedIssue,
  } = useIssueListNesting({
    enabled: enableNestedRows,
    projectDataUpdatedAt: projectIssues.dataUpdatedAt,
  });

  const rows = useMemo((): IssueRow[] => {
    const source = issueId ? (subIssues.data ?? []) : (projectIssues.data ?? []);
    const mapped = source.flatMap((issue) => {
      if (!issue) return [];
      const isOpen =
        enableNestedRows && issue.id ? expandedParentIds.has(issue.id) : false;
      const childSources =
        isOpen && issue.id ? childrenByParentId[issue.id] : undefined;
      const children =
        childSources === undefined
          ? undefined
          : sortIssueRows(
              childSources.flatMap((child) => {
                const childRow = toIssueRow(child, {
                  statusById,
                  statusOverrides,
                  nameOverrides,
                });
                return childRow ? [childRow] : [];
              }),
            );
      const row = toIssueRow(issue, {
        statusById,
        statusOverrides,
        nameOverrides,
        isNestedExpanded: isOpen,
        children,
      });
      return row ? [row] : [];
    });

    return sortIssueRows(mapped);
  }, [
    childrenByParentId,
    enableNestedRows,
    expandedParentIds,
    issueId,
    nameOverrides,
    projectIssues.data,
    statusById,
    statusOverrides,
    subIssues.data,
  ]);

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

  const shouldGroup = Boolean(projectId);
  const columns = shouldGroup ? GROUPED_COLUMNS : FLAT_COLUMNS;

  const uiValue = useMemo(
    (): IssueListUiContextValue => ({
      editingIssueId,
      priorityOverrides,
      dueDateOverrides,
      statuses,
      isSaving,
      showExpandGutter: enableNestedRows,
      expandingIssueIds,
      onStartEditing,
      onFinishEditing,
      onSaveName: handleNameChange,
      onPriorityChange,
      onDueDateChange,
      onStatusChange,
      onOpenMenu,
      onToggleNestedIssue,
    }),
    [
      dueDateOverrides,
      editingIssueId,
      enableNestedRows,
      expandingIssueIds,
      handleNameChange,
      isSaving,
      onDueDateChange,
      onFinishEditing,
      onOpenMenu,
      onPriorityChange,
      onStartEditing,
      onStatusChange,
      onToggleNestedIssue,
      priorityOverrides,
      statuses,
    ],
  );

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
          enableNestedRows={enableNestedRows}
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
