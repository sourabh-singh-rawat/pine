import Add from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import { Modal, ModalBody, ModalHeader, pineShape } from "@pine/ui";
import { useState, type MouseEvent } from "react";
import { CreateOrganizationRelationForm } from "../CreateOrganizationRelationForm";

export type CreateOrganizationRelationModalProps = {
  organizationId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const CreateOrganizationRelationModal = ({
  organizationId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateOrganizationRelationModalProps) => {
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
        aria-label="Create organization relation"
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
          title="Create organization relation"
          subtitle="Assign an identity to this organization with a graph relation."
          onClose={handleClose}
        />
        <ModalBody>
          <CreateOrganizationRelationForm
            organizationId={organizationId}
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
