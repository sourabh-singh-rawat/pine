import Add from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import { Modal, ModalBody, ModalHeader, pineShape } from "@pine/ui";
import { useState, type MouseEvent } from "react";
import { CreateTenantForm } from "../CreateTenantForm";

export type CreateTenantModalProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const CreateTenantModal = ({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateTenantModalProps) => {
  const theme = useTheme();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen;

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
        aria-label="Create tenant"
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
          title="Create tenant"
          subtitle="Add a new tenant to the platform."
          onClose={handleClose}
        />
        <ModalBody>
          <CreateTenantForm
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
