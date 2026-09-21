import { type ItemRow, statusOrderIndex } from "./types";

export type ItemSource = {
  id?: string | null;
  name?: string | null;
  statusId?: string | null;
  priority?: string | null;
  dueDate?: unknown;
  hasChildren?: boolean | null;
};

export const toItemRow = (
  item: ItemSource,
  options: {
    statusById: Map<string, string>;
    statusOverrides: Record<string, { statusId: string; statusName: string }>;
    nameOverrides: Record<string, string>;
    isNestedExpanded?: boolean;
    children?: ItemRow[];
  },
): ItemRow | null => {
  if (!item.id || !item.name) return null;

  const baseStatusId = typeof item.statusId === "string" ? item.statusId : "";
  const statusOverride = options.statusOverrides[item.id];
  const statusId = statusOverride?.statusId ?? baseStatusId;
  const statusName =
    statusOverride?.statusName ?? options.statusById.get(statusId) ?? "No status";
  const priority = typeof item.priority === "string" ? item.priority : "";
  const name = options.nameOverrides[item.id] ?? item.name;
  const dueDate = typeof item.dueDate === "string" ? item.dueDate : null;

  return {
    id: item.id,
    name,
    statusId,
    statusName,
    statusOrder: statusOrderIndex(statusName),
    priority,
    dueDate,
    hasChildren: Boolean(item.hasChildren),
    isNestedExpanded: options.isNestedExpanded ?? false,
    children: options.children,
  };
};

export const sortItemRows = (rows: ItemRow[]) =>
  rows.slice().sort((a, b) => {
    if (a.statusOrder !== b.statusOrder) return a.statusOrder - b.statusOrder;
    return a.name.localeCompare(b.name);
  });
