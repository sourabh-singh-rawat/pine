export const DEFAULT_LIST_ITEMS_FIRST = 50;
export const MAX_LIST_ITEMS_FIRST = 100;

export const clampListItemsFirst = (first: number | null | undefined): number => {
  if (first == null || !Number.isFinite(first)) {
    return DEFAULT_LIST_ITEMS_FIRST;
  }
  const rounded = Math.trunc(first);
  if (rounded < 1) {
    return 1;
  }
  if (rounded > MAX_LIST_ITEMS_FIRST) {
    return MAX_LIST_ITEMS_FIRST;
  }
  return rounded;
};
