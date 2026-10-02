import { describe, expect, it } from "vitest";
import { ListItemsValidationError } from "@/features/item/errors";
import { decodeItemListCursor, encodeItemListCursor } from "@/features/item/utils/itemListCursor";

describe("itemListCursor", () => {
  it("round-trips orderIndex and id", () => {
    const cursor = encodeItemListCursor({ orderIndex: 3, id: "item-1" });
    expect(decodeItemListCursor(cursor)).toEqual({ orderIndex: 3, id: "item-1" });
  });

  it("rejects invalid cursors", () => {
    expect(() => decodeItemListCursor("not-base64")).toThrow(ListItemsValidationError);
    expect(() =>
      decodeItemListCursor(
        Buffer.from(JSON.stringify({ v: 1, n: "a", i: "b" }), "utf8").toString("base64url"),
      ),
    ).toThrow(ListItemsValidationError);
  });
});
