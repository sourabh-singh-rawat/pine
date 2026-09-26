import { describe, expect, it } from "vitest";
import {
  clampListItemsFirst,
  DEFAULT_LIST_ITEMS_FIRST,
  MAX_LIST_ITEMS_FIRST,
} from "@/features/item/utils/clampListItemsFirst";

describe("clampListItemsFirst", () => {
  it("clamps first to defaults and bounds", () => {
    expect(clampListItemsFirst(undefined)).toBe(DEFAULT_LIST_ITEMS_FIRST);
    expect(clampListItemsFirst(null)).toBe(DEFAULT_LIST_ITEMS_FIRST);
    expect(clampListItemsFirst(0)).toBe(1);
    expect(clampListItemsFirst(-5)).toBe(1);
    expect(clampListItemsFirst(25.9)).toBe(25);
    expect(clampListItemsFirst(MAX_LIST_ITEMS_FIRST + 10)).toBe(MAX_LIST_ITEMS_FIRST);
  });
});
