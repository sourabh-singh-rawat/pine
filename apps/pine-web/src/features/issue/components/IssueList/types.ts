export interface IssueListProps {
  issueId?: string;
  projectId?: string;
  filters?: IssueListFilters;
  style?: IssueListStyles;
}

export interface IssueListFilters {}

export interface IssueListStyles {
  showBorder?: boolean;
}

export type IssueRow = {
  id: string;
  name: string;
  statusId: string;
  statusName: string;
  statusOrder: number;
  priority: string;
  dueDate?: string | null;
};

export const STATUS_NAME_ORDER = ["To Do", "In Progress", "Done", "Cancelled"];

export const statusOrderIndex = (name: string) => {
  const index = STATUS_NAME_ORDER.indexOf(name);
  return index === -1 ? STATUS_NAME_ORDER.length : index;
};
