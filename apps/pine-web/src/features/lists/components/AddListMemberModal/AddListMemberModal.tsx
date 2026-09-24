import MuiList from "@mui/material/List";
import Modal from "../../../../shared/components/Modal";
import ModalBody from "../../../../shared/components/ModalBody";
import ModalHeader from "../../../../shared/components/ModalHeader";

type AddListMemberModalProps = {
  open: boolean;
  handleClose: () => void;
};

export const AddListMemberModal = ({ open, handleClose }: AddListMemberModalProps) => {
  return (
    <Modal open={open} handleClose={handleClose}>
      <ModalHeader
        title="Add new member to this list"
        subtitle="Only admin and owners can add new members"
        handleClose={handleClose}
      />
      <ModalBody>
        <MuiList dense />
      </ModalBody>
    </Modal>
  );
};
