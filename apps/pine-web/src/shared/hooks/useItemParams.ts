import { useParams } from "@tanstack/react-router";

export const useItemParams = () => {
  const { itemId } = useParams({ strict: false });

  if (!itemId) throw new Error("Item ID is required");

  return { itemId };
};
