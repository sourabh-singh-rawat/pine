import { createContext, useContext } from "react";

export interface DataTableContextValue {
  leafColumnCount: number;
}

export const DataTableContext = createContext<DataTableContextValue | null>(null);

export const useDataTableContext = (): DataTableContextValue => {
  const context = useContext(DataTableContext);
  if (!context) {
    throw new Error("useDataTableContext must be used within a DataTableRoot or DataTable component");
  }
  return context;
};
