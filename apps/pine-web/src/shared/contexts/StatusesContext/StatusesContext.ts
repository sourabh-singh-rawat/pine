import { createContext } from "react";

export type StatusOption = {
  id: string;
  name: string;
};

export type StatusesContextValue = {
  statuses: StatusOption[];
};

const initialValue: StatusesContextValue = {
  statuses: [],
};

export const StatusesContext = createContext<StatusesContextValue>(initialValue);
