import { create } from "zustand";

export type CurrentList = {
  id: string;
  name: string;
  spaceId?: string;
};

interface ListState {
  currentList: CurrentList | null;
  setCurrentList: (list: CurrentList | null) => void;
}

export const useListStore = create<ListState>((set) => ({
  currentList: null,
  setCurrentList: (list) => set({ currentList: list }),
}));
