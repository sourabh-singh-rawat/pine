import { createContext, useContext } from "react";

export type ItemListDragContextValue = {
  disabled: boolean;
  rootIndexById: ReadonlyMap<string, number>;
};

export const ItemListDragContext = createContext<ItemListDragContextValue | null>(null);

export const useItemListDragContext = (): ItemListDragContextValue => {
  const value = useContext(ItemListDragContext);
  if (!value) {
    throw new Error("useItemListDragContext must be used within ItemListDragContext");
  }
  return value;
};
