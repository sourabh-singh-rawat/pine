import { createContext } from "react";
import type { MenuAnchorPosition } from "@pine/ui";

export type IssueListUiContextValue = {
  editingIssueId: string | null;
  priorityOverrides: Record<string, string>;
  dueDateOverrides: Record<string, string | null>;
  isSaving: boolean;
  onStartEditing: (issueId: string) => void;
  onFinishEditing: (issueId: string) => void;
  onSaveName: (issueId: string, name: string) => Promise<boolean>;
  onPriorityChange: (issueId: string, priority: string) => void;
  onDueDateChange: (issueId: string, dueDate: string | null) => void;
  onOpenMenu: (issueId: string, position: MenuAnchorPosition) => void;
};

export const IssueListUiContext = createContext<IssueListUiContextValue | null>(
  null,
);
