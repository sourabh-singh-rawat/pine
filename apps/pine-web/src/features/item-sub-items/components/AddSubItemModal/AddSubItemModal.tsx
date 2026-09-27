import { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PrimaryButton,
  SecondaryButton,
} from "@pine/ui";
import { ItemForm } from "@features/item";

const ADD_SUB_ITEM_FORM_ID = "add-sub-item-form";

interface AddSubItemModalProps {
  listId: string;
  parentItemId: string;
}

export const AddSubItemModal = ({ listId, parentItemId }: AddSubItemModalProps) => {
  const [open, setOpen] = useState(false);
  const onClose = () => {
    setOpen(false);
  };
  const onOpen = () => {
    setOpen(true);
  };

  return (
    <>
      <PrimaryButton label="Add Sub Item" onClick={onOpen} size="small" />
      <Modal open={open} onClose={onClose}>
        <ModalHeader title="New Sub Item" onClose={onClose} />
        <ModalBody>
          <ItemForm
            listId={listId}
            parentItemId={parentItemId}
            formId={ADD_SUB_ITEM_FORM_ID}
            onSuccess={onClose}
          />
        </ModalBody>
        <ModalFooter>
          <SecondaryButton label="Cancel" onClick={onClose} />
          <PrimaryButton type="submit" form={ADD_SUB_ITEM_FORM_ID} label="Create Sub Item" />
        </ModalFooter>
      </Modal>
    </>
  );
};
