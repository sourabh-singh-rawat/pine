import Add from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import { Modal, ModalBody, ModalHeader, pineShape } from "@pine/ui";
import { useState, type MouseEvent } from "react";
import { CreateOfficeTypeForm } from "../CreateOfficeTypeForm";

export type CreateOfficeTypeModalProps = {
  tenantId: string;
};

export const CreateOfficeTypeModal = ({ tenantId }: CreateOfficeTypeModalProps) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleOpen = (event?: MouseEvent) => {
    event?.stopPropagation();
    setOpen(true);
  };

  const handleClose = (event?: MouseEvent | object) => {
    if (event && "stopPropagation" in event && typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
    setOpen(false);
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        aria-label="Create office type"
        sx={{
          borderRadius: pineShape.borderRadiusMedium,
          ":hover": { bgcolor: theme.palette.action.hover },
        }}
        disableRipple
      >
        <Add fontSize="small" />
      </IconButton>
      <Modal open={open} onClose={handleClose}>
        <ModalHeader
          title="Create office type"
          subtitle="Add an office type this tenant can assign to organizations."
          onClose={handleClose}
        />
        <ModalBody>
          <CreateOfficeTypeForm
            tenantId={tenantId}
            onCancel={() => {
              setOpen(false);
            }}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        </ModalBody>
      </Modal>
    </>
  );
};
