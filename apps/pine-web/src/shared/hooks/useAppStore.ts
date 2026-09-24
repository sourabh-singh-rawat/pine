import { useNavigate } from "@tanstack/react-router";
import { useListStore } from "../../features/lists/store";

export const useAppStore = () => {
  const navigate = useNavigate();
  const currentList = useListStore((s) => s.currentList);

  if (!currentList) {
    navigate({ to: "/" });
  }

  return { currentList };
};
