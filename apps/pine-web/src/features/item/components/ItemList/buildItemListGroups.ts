import { sortItemRows, toItemRow, type ItemSource } from "./mapItemRow";
import { type ItemRow } from "./types";

export type ItemListGroup = {
  statusId: string;
  statusName: string;
  rows: ItemRow[];
  totalCount: number;
  hasNextPage: boolean;
  endCursor: string | null;
};

type ListItemGroupSource = {
  status?: {
    id?: string | null;
    name?: string | null;
  } | null;
  items?: Array<ItemSource | null> | null;
  totalCount?: number | null;
  pageInfo?: {
    hasNextPage?: boolean | null;
    endCursor?: string | null;
  } | null;
} | null;

export const buildItemListGroups = (options: {
  sourceGroups: ListItemGroupSource[];
  statusById: Map<string, string>;
  statusOverrides: Record<string, { statusId: string; statusName: string }>;
  nameOverrides: Record<string, string>;
  expandedParentIds: ReadonlySet<string>;
  enableNestedRows: boolean;
  childrenByParentId: Record<string, ItemSource[]>;
}): ItemListGroup[] => {
  const {
    sourceGroups,
    statusById,
    statusOverrides,
    nameOverrides,
    expandedParentIds,
    enableNestedRows,
    childrenByParentId,
  } = options;

  const buckets = new Map<string, ItemListGroup>();
  for (const group of sourceGroups) {
    if (!group) {
      continue;
    }
    const status = group.status;
    if (!status?.id || !status.name) {
      continue;
    }
    buckets.set(status.id, {
      statusId: status.id,
      statusName: status.name,
      rows: [],
      totalCount: group.totalCount ?? 0,
      hasNextPage: Boolean(group.pageInfo?.hasNextPage),
      endCursor: group.pageInfo?.endCursor ?? null,
    });
  }

  for (const group of sourceGroups) {
    for (const item of group?.items ?? []) {
      if (!item) {
        continue;
      }
      const isOpen = enableNestedRows && item.id ? expandedParentIds.has(item.id) : false;
      const childSources = isOpen && item.id ? childrenByParentId[item.id] : undefined;
      const children =
        childSources === undefined
          ? undefined
          : sortItemRows(
              childSources.flatMap((child) => {
                const childRow = toItemRow(child, {
                  statusById,
                  statusOverrides,
                  nameOverrides,
                });
                return childRow ? [childRow] : [];
              }),
            );
      const row = toItemRow(item, {
        statusById,
        statusOverrides,
        nameOverrides,
        isNestedExpanded: isOpen,
        children,
      });
      if (!row) {
        continue;
      }
      const bucket = buckets.get(row.statusId);
      if (bucket) {
        bucket.rows.push(row);
      }
    }
  }

  return [...buckets.values()].map((group) => ({
    ...group,
    rows: sortItemRows(group.rows),
  }));
};
