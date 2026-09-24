import { ItemModal } from "../ItemModal";

interface AddItemButtonProps {
  listId: string;
}

export const AddItemButton = ({ listId }: AddItemButtonProps) => {
  return <ItemModal listId={listId} />;
};
