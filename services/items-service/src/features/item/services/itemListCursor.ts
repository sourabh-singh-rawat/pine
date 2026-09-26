import { ListItemsValidationError } from "@/features/item/errors";

type ItemListCursorV1 = {
  v: 1;
  n: string;
  i: string;
};

export type DecodedItemListCursor = {
  name: string;
  id: string;
};

export const encodeItemListCursor = (item: { name: string; id: string }): string => {
  const payload: ItemListCursorV1 = { v: 1, n: item.name, i: item.id };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
};

export const decodeItemListCursor = (cursor: string): DecodedItemListCursor => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    throw new ListItemsValidationError("Invalid list items cursor");
  }

  if (!isItemListCursorV1(parsed)) {
    throw new ListItemsValidationError("Invalid list items cursor");
  }

  return { name: parsed.n, id: parsed.i };
};

const isItemListCursorV1 = (value: unknown): value is ItemListCursorV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("v" in value) || !("n" in value) || !("i" in value)) {
    return false;
  }
  return value.v === 1 && typeof value.n === "string" && typeof value.i === "string";
};
