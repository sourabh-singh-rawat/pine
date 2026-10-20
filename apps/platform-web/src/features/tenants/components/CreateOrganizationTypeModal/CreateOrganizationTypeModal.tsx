import Add from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import { Modal, ModalBody, ModalHeader, pineShape } from "@pine/ui";
import { useState, type MouseEvent } from "react";
import { CreateOrganizationTypeForm } from "../CreateOrganizationTypeForm";

export type CreateOrganizationTypeModalProps = {
  tenantId: string;
};

export const CreateOrganizationTypeModal = ({ tenantId }: CreateOrganizationTypeModalProps) => {
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
        aria-label="Create organization type"
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
          title="Create organization type"
          subtitle="Add an organization type this tenant can assign to organizations."
          onClose={handleClose}
        />
        <ModalBody>
          <CreateOrganizationTypeForm
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
