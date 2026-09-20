import MoreVert from "@mui/icons-material/MoreVert";
import { IconButton } from "@mui/material";
import { useContext } from "react";
import { IssueDueDateCell } from "./IssueDueDateCell";
import { IssueNameCell } from "./IssueNameCell";
import { IssuePriorityCell } from "./IssuePriorityCell";
import { IssueStatusCell } from "./IssueStatusCell";
import { IssueListUiContext } from "./IssueListUiContext";

export const IssueStatusTableCell = ({
  issueId,
  statusId,
  statusName,
}: {
  issueId: string;
  statusId: string;
  statusName: string;
}) => {
  const ui = useContext(IssueListUiContext);
  if (!ui) return null;
  return (
    <IssueStatusCell
      issueId={issueId}
      statusId={statusId}
      statusName={statusName}
      statuses={ui.statuses}
      disabled={ui.isSaving}
      onChange={(nextStatusId) => {
        ui.onStatusChange(issueId, nextStatusId);
      }}
    />
  );
};

export const IssueNameTableCell = ({
  issueId,
  name,
  depth,
  hasChildren,
  isExpanded,
}: {
  issueId: string;
  name: string;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}) => {
  const ui = useContext(IssueListUiContext);
  if (!ui) return name;

  return (
    <IssueNameCell
      issueId={issueId}
      name={name}
      depth={depth}
      hasChildren={hasChildren}
      showExpandGutter={ui.showExpandGutter}
      isExpanded={isExpanded}
      isExpanding={ui.expandingIssueIds.has(issueId)}
      isEditing={ui.editingIssueId === issueId}
      isSaving={ui.isSaving}
      onStartEditing={() => ui.onStartEditing(issueId)}
      onFinishEditing={() => ui.onFinishEditing(issueId)}
      onSave={async (nextName) => ui.onSaveName(issueId, nextName)}
      onToggleExpand={() => {
        if (!hasChildren) return;
        ui.onToggleNestedIssue(issueId);
      }}
    />
  );
};

export const IssuePriorityTableCell = ({
  issueId,
  value,
}: {
  issueId: string;
  value: string;
}) => {
  const ui = useContext(IssueListUiContext);
  if (!ui) return value;
  const current = ui.priorityOverrides[issueId] ?? value;
  return (
    <IssuePriorityCell
      issueId={issueId}
      value={current}
      disabled={ui.isSaving}
      onChange={(nextPriority) => {
        ui.onPriorityChange(issueId, nextPriority);
      }}
    />
  );
};

export const IssueDueDateTableCell = ({
  issueId,
  value,
}: {
  issueId: string;
  value: string | null | undefined;
}) => {
  const ui = useContext(IssueListUiContext);
  const fallback = value ?? null;
  if (!ui) return fallback ?? "";
  const override = ui.dueDateOverrides[issueId];
  const current = override === undefined ? fallback : override;
  return (
    <IssueDueDateCell
      issueId={issueId}
      value={current}
      disabled={ui.isSaving}
      onChange={(nextDueDate) => {
        ui.onDueDateChange(issueId, nextDueDate);
      }}
    />
  );
};

export const IssueActionsTableCell = ({ issueId }: { issueId: string }) => {
  const ui = useContext(IssueListUiContext);
  if (!ui) return null;
  return (
    <IconButton
      size="small"
      aria-label="Issue actions"
      onClick={(event) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        ui.onOpenMenu(issueId, { top: rect.bottom, left: rect.left });
      }}
    >
      <MoreVert fontSize="small" />
    </IconButton>
  );
};
