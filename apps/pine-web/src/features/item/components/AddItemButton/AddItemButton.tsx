import { ItemModal } from "../ItemModal";

interface AddItemButtonProps {
  projectId: string;
}

export const AddItemButton = ({ projectId }: AddItemButtonProps) => {
  return <ItemModal projectId={projectId} />;
};
