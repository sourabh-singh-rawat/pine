import { type IssueRow, statusOrderIndex } from "./types";

export type IssueSource = {
  id?: string | null;
  name?: string | null;
  statusId?: string | null;
  priority?: string | null;
  dueDate?: unknown;
  hasChildren?: boolean | null;
};

export const toIssueRow = (
  issue: IssueSource,
  options: {
    statusById: Map<string, string>;
    statusOverrides: Record<string, { statusId: string; statusName: string }>;
    nameOverrides: Record<string, string>;
    isNestedExpanded?: boolean;
    children?: IssueRow[];
  },
): IssueRow | null => {
  if (!issue.id || !issue.name) return null;

  const baseStatusId = typeof issue.statusId === "string" ? issue.statusId : "";
  const statusOverride = options.statusOverrides[issue.id];
  const statusId = statusOverride?.statusId ?? baseStatusId;
  const statusName =
    statusOverride?.statusName ?? options.statusById.get(statusId) ?? "No status";
  const priority = typeof issue.priority === "string" ? issue.priority : "";
  const name = options.nameOverrides[issue.id] ?? issue.name;
  const dueDate = typeof issue.dueDate === "string" ? issue.dueDate : null;

  return {
    id: issue.id,
    name,
    statusId,
    statusName,
    statusOrder: statusOrderIndex(statusName),
    priority,
    dueDate,
    hasChildren: Boolean(issue.hasChildren),
    isNestedExpanded: options.isNestedExpanded ?? false,
    children: options.children,
  };
};

export const sortIssueRows = (rows: IssueRow[]) =>
  rows.slice().sort((a, b) => {
    if (a.statusOrder !== b.statusOrder) return a.statusOrder - b.statusOrder;
    return a.name.localeCompare(b.name);
  });
