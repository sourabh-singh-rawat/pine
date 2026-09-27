import { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PrimaryButton,
  SecondaryButton,
} from "@pine/ui";
import { ItemForm } from "../ItemForm";

const ADD_ITEM_FORM_ID = "add-item-form";

interface AddItemModalProps {
  listId: string;
}

export const AddItemModal = ({ listId }: AddItemModalProps) => {
  const [open, setOpen] = useState(false);
  const onClose = () => {
    setOpen(false);
  };
  const onOpen = () => {
    setOpen(true);
  };

  return (
    <>
      <PrimaryButton label="Add Item" onClick={onOpen} size="small" />
      <Modal open={open} onClose={onClose}>
        <ModalHeader title="New Item" onClose={onClose} />
        <ModalBody>
          <ItemForm listId={listId} formId={ADD_ITEM_FORM_ID} onSuccess={onClose} />
        </ModalBody>
        <ModalFooter>
          <SecondaryButton label="Cancel" onClick={onClose} />
          <PrimaryButton type="submit" form={ADD_ITEM_FORM_ID} label="Create Item" />
        </ModalFooter>
      </Modal>
    </>
  );
};
