import { describe, expect, it } from "vitest";
import { ListItemsValidationError } from "@/features/item/errors";
import {
  decodeItemListCursor,
  encodeItemListCursor,
} from "@/features/item/services/itemListCursor";

describe("itemListCursor", () => {
  it("round-trips name and id", () => {
    const cursor = encodeItemListCursor({ name: "Apple", id: "item-1" });
    expect(decodeItemListCursor(cursor)).toEqual({ name: "Apple", id: "item-1" });
  });

  it("rejects invalid cursors", () => {
    expect(() => decodeItemListCursor("not-base64")).toThrow(ListItemsValidationError);
    expect(() =>
      decodeItemListCursor(
        Buffer.from(JSON.stringify({ v: 2, n: "a", i: "b" }), "utf8").toString("base64url"),
      ),
    ).toThrow(ListItemsValidationError);
  });
});
