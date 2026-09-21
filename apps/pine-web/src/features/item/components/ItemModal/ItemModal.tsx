import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import Modal from "../../../../shared/components/Modal";
import ModalBody from "../../../../shared/components/ModalBody";
import ModalHeader from "../../../../shared/components/ModalHeader";
import PrimaryButton from "../../../../shared/components/buttons/PrimaryButton";
import { ItemForm } from "../ItemForm";

interface ItemModalProps {
  projectId: string;
}

export const ItemModal = ({ projectId }: ItemModalProps) => {
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);
  const { itemId } = useParams({ strict: false });

  return (
    <>
      <PrimaryButton label="Add Item" onClick={handleOpen} size="small" />
      <Modal open={open} handleClose={handleClose}>
        <ModalHeader title="New Item" handleClose={handleClose} subtitle="" />
        <ModalBody>
          <ItemForm projectId={projectId} parentItemId={itemId} />
        </ModalBody>
      </Modal>
    </>
  );
};
