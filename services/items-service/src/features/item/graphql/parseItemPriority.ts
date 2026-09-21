import { ITEM_PRIORITY, type ItemPriority } from "@pine/common";

export const parseItemPriority = (value: string): ItemPriority => {
  switch (value) {
    case ITEM_PRIORITY.URGENT:
      return ITEM_PRIORITY.URGENT;
    case ITEM_PRIORITY.HIGH:
      return ITEM_PRIORITY.HIGH;
    case ITEM_PRIORITY.NORMAL:
      return ITEM_PRIORITY.NORMAL;
    case ITEM_PRIORITY.LOW:
      return ITEM_PRIORITY.LOW;
    default:
      throw new Error(`Invalid priority: ${value}`);
  }
};
