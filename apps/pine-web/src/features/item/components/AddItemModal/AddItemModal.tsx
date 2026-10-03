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

export interface AddItemModalProps {
  listId: string;
  defaultStatusId?: string;
  type?: string;
  defaultName?: string;
  open?: boolean;
  onClose?: () => void;
  hideTrigger?: boolean;
}

export const AddItemModal = ({
  listId,
  defaultStatusId,
  type = "issue",
  defaultName,
  open: controlledOpen,
  onClose: controlledOnClose,
  hideTrigger = false,
}: AddItemModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleClose = () => {
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  const handleOpen = () => {
    setInternalOpen(true);
  };

  const title = type === "issue" ? "New Issue" : "New Item";
  const submitLabel = type === "issue" ? "Create Issue" : "Create Item";

  return (
    <>
      {!hideTrigger ? <PrimaryButton label="Add Item" onClick={handleOpen} size="small" /> : null}
      <Modal open={isOpen} onClose={handleClose}>
        <ModalHeader title={title} onClose={handleClose} />
        <ModalBody>
          <ItemForm
            listId={listId}
            defaultStatusId={defaultStatusId}
            type={type}
            defaultName={defaultName}
            formId={ADD_ITEM_FORM_ID}
            onSuccess={handleClose}
          />
        </ModalBody>
        <ModalFooter>
          <SecondaryButton label="Cancel" onClick={handleClose} />
          <PrimaryButton type="submit" form={ADD_ITEM_FORM_ID} label={submitLabel} />
        </ModalFooter>
      </Modal>
    </>
  );
};
