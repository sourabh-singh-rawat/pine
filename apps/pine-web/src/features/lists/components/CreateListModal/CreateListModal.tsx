import Add from "@mui/icons-material/Add";
import { IconButton, useTheme } from "@mui/material";
import React, { type MouseEvent } from "react";
import Modal from "../../../../shared/components/Modal";
import ModalBody from "../../../../shared/components/ModalBody";
import ModalHeader from "../../../../shared/components/ModalHeader";
import { ListForm } from "../ListForm";

type CreateListModalProps = {
  spaceId: string;
  disabled?: boolean;
};

export const CreateListModal = ({ spaceId, disabled = false }: CreateListModalProps) => {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleOpen = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (disabled) {
      return;
    }
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        disabled={disabled}
        sx={{
          borderRadius: theme.shape.borderRadiusLarge,
          ":hover": { bgcolor: theme.palette.action.hover },
        }}
        disableRipple
      >
        <Add fontSize="small" />
      </IconButton>
      <Modal open={open} onClose={onClose}>
        <ModalHeader
          title="Create List"
          subtitle="A List is a container for items."
          onClose={onClose}
        />
        <ModalBody>
          <ListForm spaceId={spaceId} onSuccess={onClose} />
        </ModalBody>
      </Modal>
    </>
  );
};
