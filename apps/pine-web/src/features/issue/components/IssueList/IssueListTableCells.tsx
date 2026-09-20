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
}: {
  issueId: string;
  name: string;
}) => {
  const ui = useContext(IssueListUiContext);
  if (!ui) return name;
  return (
    <IssueNameCell
      issueId={issueId}
      name={name}
      isEditing={ui.editingIssueId === issueId}
      isSaving={ui.isSaving}
      onStartEditing={() => ui.onStartEditing(issueId)}
      onFinishEditing={() => ui.onFinishEditing(issueId)}
      onSave={async (nextName) => ui.onSaveName(issueId, nextName)}
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
