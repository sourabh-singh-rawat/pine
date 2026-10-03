import { ListItemsValidationError } from "@/features/item/errors";

type ItemListCursorV2 = {
  v: 2;
  o: number;
  i: string;
};

export type DecodedItemListCursor = {
  orderIndex: number;
  id: string;
};

export const encodeItemListCursor = (item: { orderIndex: number; id: string }): string => {
  const payload: ItemListCursorV2 = { v: 2, o: item.orderIndex, i: item.id };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
};

export const decodeItemListCursor = (cursor: string): DecodedItemListCursor => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    throw new ListItemsValidationError("Invalid list items cursor");
  }

  if (!isItemListCursorV2(parsed)) {
    throw new ListItemsValidationError("Invalid list items cursor");
  }

  return { orderIndex: parsed.o, id: parsed.i };
};

const isItemListCursorV2 = (value: unknown): value is ItemListCursorV2 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("v" in value) || !("o" in value) || !("i" in value)) {
    return false;
  }
  return (
    value.v === 2 &&
    typeof value.o === "number" &&
    Number.isFinite(value.o) &&
    typeof value.i === "string"
  );
};
