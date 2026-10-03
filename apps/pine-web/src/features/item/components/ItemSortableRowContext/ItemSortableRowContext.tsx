import { createContext, useContext, type Ref } from "react";

export type ItemSortableRowContextValue = {
  handleRef: Ref<HTMLButtonElement>;
  disabled: boolean;
};

export const ItemSortableRowContext = createContext<ItemSortableRowContextValue | null>(null);

export const useItemSortableRowContext = (): ItemSortableRowContextValue => {
  const value = useContext(ItemSortableRowContext);
  if (!value) {
    throw new Error("useItemSortableRowContext must be used within ItemSortableRowContext");
  }
  return value;
};
