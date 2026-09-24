import type { GetChecklistsQuery } from "@generated/gql";

type ChecklistRow = NonNullable<
  NonNullable<GetChecklistsQuery["getChecklists"]>[number]
>;
type EntryRow = NonNullable<NonNullable<ChecklistRow["entries"]>[number]>;

export type ChecklistEntryView = {
  id: string;
  checklistId: string;
  title: string;
  completed: boolean;
  orderIndex: number;
};

export type ChecklistView = {
  id: string;
  itemId: string;
  name: string;
  completedCount: number;
  totalCount: number;
  entries: ChecklistEntryView[];
};

const toEntryView = (entry: EntryRow): ChecklistEntryView | null => {
  if (
    typeof entry.id !== "string" ||
    typeof entry.checklistId !== "string" ||
    typeof entry.title !== "string"
  ) {
    return null;
  }

  return {
    id: entry.id,
    checklistId: entry.checklistId,
    title: entry.title,
    completed: Boolean(entry.completed),
    orderIndex: typeof entry.orderIndex === "number" ? entry.orderIndex : 0,
  };
};

export const toChecklistView = (
  checklist: ChecklistRow | null | undefined,
): ChecklistView | null => {
  if (
    !checklist ||
    typeof checklist.id !== "string" ||
    typeof checklist.itemId !== "string" ||
    typeof checklist.name !== "string"
  ) {
    return null;
  }

  const entries = (checklist.entries ?? [])
    .map(toEntryView)
    .filter((entry): entry is ChecklistEntryView => entry !== null)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    id: checklist.id,
    itemId: checklist.itemId,
    name: checklist.name,
    completedCount:
      typeof checklist.completedCount === "number" ? checklist.completedCount : 0,
    totalCount: typeof checklist.totalCount === "number" ? checklist.totalCount : 0,
    entries,
  };
};

export const mapChecklists = (
  rows: GetChecklistsQuery["getChecklists"],
): ChecklistView[] =>
  (rows ?? [])
    .map(toChecklistView)
    .filter((checklist): checklist is ChecklistView => checklist !== null);
