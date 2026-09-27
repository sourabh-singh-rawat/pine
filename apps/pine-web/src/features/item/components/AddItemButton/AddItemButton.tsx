import { AddItemModal } from "../AddItemModal";

interface AddItemButtonProps {
  listId: string;
}

export const AddItemButton = ({ listId }: AddItemButtonProps) => {
  return <AddItemModal listId={listId} />;
};
