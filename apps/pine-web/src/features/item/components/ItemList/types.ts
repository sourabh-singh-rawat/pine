export interface ItemListProps {
  itemId?: string;
  listId?: string;
  filters?: ItemListFilters;
  style?: ItemListStyles;
}

export interface ItemListFilters {}

export interface ItemListStyles {
  showBorder?: boolean;
}

export type ItemRow = {
  id: string;
  name: string;
  statusId: string;
  statusName: string;
  statusOrder: number;
  priority: string;
  dueDate?: string | null;
  hasChildren: boolean;
  isNestedExpanded: boolean;
  checklistCompletedCount: number;
  checklistTotalCount: number;
  children?: ItemRow[];
};

export const STATUS_NAME_ORDER = ["To Do", "In Progress", "Done", "Cancelled"];

export const statusOrderIndex = (name: string) => {
  const index = STATUS_NAME_ORDER.indexOf(name);
  return index === -1 ? STATUS_NAME_ORDER.length : index;
};
