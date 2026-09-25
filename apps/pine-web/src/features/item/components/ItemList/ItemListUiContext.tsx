import { createContext } from "react";
import type { MenuAnchorPosition } from "@pine/ui";
import type { StatusOption } from "@shared/contexts/StatusesContext";

export type ItemStatusOverride = {
  statusId: string;
  statusName: string;
};

export type ItemListUiContextValue = {
  editingItemId: string | null;
  priorityOverrides: Record<string, string>;
  dueDateOverrides: Record<string, string | null>;
  statuses: StatusOption[];
  isSaving: boolean;
  showExpandGutter: boolean;
  expandingItemIds: ReadonlySet<string>;
  onStartEditing: (itemId: string) => void;
  onFinishEditing: (itemId: string) => void;
  onSaveName: (itemId: string, name: string) => Promise<boolean>;
  onPriorityChange: (itemId: string, priority: string) => void;
  onDueDateChange: (itemId: string, dueDate: string | null) => void;
  onStatusChange: (itemId: string, statusId: string) => void;
  onOpenMenu: (itemId: string, position: MenuAnchorPosition) => void;
  onToggleNestedItem: (itemId: string) => void;
};

export const ItemListUiContext = createContext<ItemListUiContextValue | null>(null);
