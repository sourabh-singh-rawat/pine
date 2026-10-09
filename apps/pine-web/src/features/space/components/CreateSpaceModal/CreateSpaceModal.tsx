import Add from "@mui/icons-material/Add";
import { IconButton, useTheme } from "@mui/material";
import React, { type MouseEvent } from "react";
import Modal from "../../../../shared/components/Modal";
import ModalBody from "../../../../shared/components/ModalBody";
import ModalHeader from "../../../../shared/components/ModalHeader";
import { SpaceForm } from "../SpaceForm";

type CreateSpaceModalProps = {
  disabled?: boolean;
};

export const CreateSpaceModal = ({ disabled = false }: CreateSpaceModalProps) => {
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
          title="Create Space"
          subtitle="A Space groups related work in a organization."
          onClose={onClose}
        />
        <ModalBody>
          <SpaceForm onSuccess={onClose} />
        </ModalBody>
      </Modal>
    </>
  );
};
