import { createContext } from "react";
import type { MenuAnchorPosition } from "@pine/ui";
import type { StatusOption } from "@shared/contexts/StatusesContext";

export type IssueStatusOverride = {
  statusId: string;
  statusName: string;
};

export type IssueListUiContextValue = {
  editingIssueId: string | null;
  priorityOverrides: Record<string, string>;
  dueDateOverrides: Record<string, string | null>;
  statuses: StatusOption[];
  isSaving: boolean;
  showExpandGutter: boolean;
  expandingIssueIds: ReadonlySet<string>;
  onStartEditing: (issueId: string) => void;
  onFinishEditing: (issueId: string) => void;
  onSaveName: (issueId: string, name: string) => Promise<boolean>;
  onPriorityChange: (issueId: string, priority: string) => void;
  onDueDateChange: (issueId: string, dueDate: string | null) => void;
  onStatusChange: (issueId: string, statusId: string) => void;
  onOpenMenu: (issueId: string, position: MenuAnchorPosition) => void;
  onToggleNestedIssue: (issueId: string) => void;
};

export const IssueListUiContext = createContext<IssueListUiContextValue | null>(
  null,
);
