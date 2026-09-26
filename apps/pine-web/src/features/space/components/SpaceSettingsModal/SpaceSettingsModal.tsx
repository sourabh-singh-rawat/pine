import { Stack, TextField } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useGetSpacesQuery, useUpdateSpaceMutation } from "@generated/gql";
import { Modal, ModalBody, ModalHeader, PrimaryButton, useSnackbar } from "@shared";
import { useSpaceStore } from "../../store";

type SpaceSettingsModalProps = {
  spaceId: string;
  workspaceId: string;
  name: string;
  open: boolean;
  onClose: () => void;
};

export const SpaceSettingsModal = ({
  spaceId,
  workspaceId,
  name,
  open,
  onClose,
}: SpaceSettingsModalProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const updateSpaceMutation = useUpdateSpaceMutation();
  const currentSpace = useSpaceStore((s) => s.currentSpace);
  const setCurrentSpace = useSpaceStore((s) => s.setCurrentSpace);
  const [nameValue, setNameValue] = useState(name);

  useEffect(() => {
    if (open) {
      setNameValue(name);
    }
  }, [open, name]);

  const handleSave = async () => {
    const nextName = nameValue.trim();
    if (nextName.length === 0) {
      snackbar.error("Space name is required");
      return;
    }
    if (nextName === name) {
      onClose();
      return;
    }

    try {
      await updateSpaceMutation.mutateAsync({
        input: {
          id: spaceId,
          name: nextName,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: useGetSpacesQuery.getKey({ workspaceId }),
      });
      if (currentSpace?.id === spaceId) {
        setCurrentSpace({
          id: spaceId,
          name: nextName,
          workspaceId,
        });
      }
      snackbar.success("Space updated");
      onClose();
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to update space");
    }
  };

  return (
    <Modal open={open} handleClose={onClose}>
      <ModalHeader
        title="Space settings"
        subtitle="Update how this space appears in the sidebar."
        handleClose={onClose}
      />
      <ModalBody>
        <Stack spacing={2}>
          <TextField
            label="Name"
            value={nameValue}
            disabled={updateSpaceMutation.isPending}
            autoFocus
            fullWidth
            onChange={(event) => {
              setNameValue(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSave();
              }
            }}
            inputProps={{ "aria-label": "Space name" }}
          />
          <PrimaryButton
            label="Save"
            isDisabled={updateSpaceMutation.isPending}
            loading={updateSpaceMutation.isPending}
            onClick={() => {
              void handleSave();
            }}
          />
        </Stack>
      </ModalBody>
    </Modal>
  );
};
