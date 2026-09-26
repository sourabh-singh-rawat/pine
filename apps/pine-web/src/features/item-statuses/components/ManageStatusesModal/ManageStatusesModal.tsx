import { Box, CircularProgress, Stack } from "@mui/material";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useCreateStatusMutation,
  useDeleteStatusMutation,
  useFindStatusesQuery,
  useReorderStatusesMutation,
  useUpdateStatusMutation,
} from "@generated/gql";
import { Modal, ModalBody, ModalHeader, useSnackbar } from "@shared";
import { emptyDraft, toStatusRow, type DraftStatus, type StatusRow } from "../../utils";
import { AddStatusForm } from "../AddStatusForm";
import { SortableStatusCard } from "../SortableStatusCard";
import { StatusListItemContent } from "../StatusListItemContent";

type ManageStatusesModalProps = {
  listId: string;
  listName: string;
  open: boolean;
  onClose: () => void;
};

export const ManageStatusesModal = ({
  listId,
  listName,
  open,
  onClose,
}: ManageStatusesModalProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const statusesQuery = useFindStatusesQuery(
    { input: { listId } },
    { enabled: open && Boolean(listId) },
  );
  const createStatusMutation = useCreateStatusMutation();
  const updateStatusMutation = useUpdateStatusMutation();
  const deleteStatusMutation = useDeleteStatusMutation();
  const reorderStatusesMutation = useReorderStatusesMutation();

  const [createDraft, setCreateDraft] = useState<DraftStatus>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftStatus>(emptyDraft);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replacementStatusId, setReplacementStatusId] = useState("");
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const isDraggingRef = useRef(false);

  const serverStatuses = useMemo(() => {
    const rows = statusesQuery.data?.findStatuses ?? [];
    const mapped: StatusRow[] = [];
    for (const row of rows) {
      const status = toStatusRow(row);
      if (status) {
        mapped.push(status);
      }
    }
    return mapped.sort((left, right) => left.orderIndex - right.orderIndex);
  }, [statusesQuery.data?.findStatuses]);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setStatuses(serverStatuses);
    }
  }, [serverStatuses]);

  const isBusy =
    createStatusMutation.isPending ||
    updateStatusMutation.isPending ||
    deleteStatusMutation.isPending ||
    reorderStatusesMutation.isPending;

  const invalidateStatuses = async () => {
    await queryClient.invalidateQueries({
      queryKey: useFindStatusesQuery.getKey({ input: { listId } }),
    });
  };

  const startEdit = (status: StatusRow) => {
    setDeletingId(null);
    setReplacementStatusId("");
    setEditingId(status.id);
    setEditDraft({
      name: status.name,
      type: status.type,
      color: status.color,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(emptyDraft());
  };

  const startDelete = (statusId: string) => {
    if (statuses.length <= 1) {
      snackbar.error("Cannot delete the last status on a list");
      return;
    }
    setEditingId(null);
    setDeletingId(statusId);
    const fallback = statuses.find((status) => status.id !== statusId);
    setReplacementStatusId(fallback?.id ?? "");
  };

  const cancelDelete = () => {
    setDeletingId(null);
    setReplacementStatusId("");
  };

  const handleCreate = async () => {
    const name = createDraft.name.trim();
    if (name.length === 0) {
      snackbar.error("Status name is required");
      return;
    }

    try {
      await createStatusMutation.mutateAsync({
        input: {
          listId,
          name,
          type: createDraft.type,
          color: createDraft.color,
        },
      });
      setCreateDraft(emptyDraft());
      await invalidateStatuses();
      snackbar.success("Status created");
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to create status");
    }
  };

  const handleUpdate = async (statusId: string) => {
    const name = editDraft.name.trim();
    if (name.length === 0) {
      snackbar.error("Status name is required");
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        input: {
          id: statusId,
          name,
          type: editDraft.type,
          color: editDraft.color,
        },
      });
      cancelEdit();
      await invalidateStatuses();
      snackbar.success("Status updated");
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) {
      return;
    }
    if (!replacementStatusId) {
      snackbar.error("Choose a status to move items to");
      return;
    }

    try {
      await deleteStatusMutation.mutateAsync({
        input: {
          id: deletingId,
          replacementStatusId,
        },
      });
      cancelDelete();
      await invalidateStatuses();
      snackbar.success("Status deleted");
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to delete status");
    }
  };

  const persistReorder = async (nextStatuses: StatusRow[]) => {
    try {
      await reorderStatusesMutation.mutateAsync({
        input: {
          listId,
          statusIds: nextStatuses.map((status) => status.id),
        },
      });
      await invalidateStatuses();
    } catch (error) {
      setStatuses(serverStatuses);
      snackbar.error(error instanceof Error ? error.message : "Failed to reorder statuses");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    isDraggingRef.current = false;
    if (event.canceled) {
      setStatuses(serverStatuses);
      return;
    }
    const nextStatuses = move(statuses, event);
    if (nextStatuses.every((status, index) => status.id === statuses[index]?.id)) {
      return;
    }
    setStatuses(nextStatuses);
    void persistReorder(nextStatuses);
  };

  const replacementOptions = statuses
    .filter((status) => status.id !== deletingId)
    .map((status) => ({ id: status.id, name: status.name }));

  return (
    <Modal open={open} handleClose={onClose}>
      <ModalHeader
        title="Manage statuses"
        subtitle={`Customize the workflow for ${listName}.`}
        handleClose={onClose}
      />
      <ModalBody>
        {statusesQuery.isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack spacing={2}>
            <DragDropProvider
              onDragStart={() => {
                isDraggingRef.current = true;
              }}
              onDragEnd={handleDragEnd}
            >
              <Stack spacing={1.5}>
                {statuses.map((status, index) => {
                  const isEditing = editingId === status.id;
                  const isDeleting = deletingId === status.id;

                  return (
                    <SortableStatusCard
                      key={status.id}
                      id={status.id}
                      index={index}
                      name={status.name}
                      disabled={isBusy || isEditing || isDeleting}
                      showHandle={!isEditing && !isDeleting}
                    >
                      <StatusListItemContent
                        status={status}
                        isEditing={isEditing}
                        isDeleting={isDeleting}
                        isBusy={isBusy}
                        canDelete={statuses.length > 1}
                        editDraft={editDraft}
                        replacementStatusId={replacementStatusId}
                        replacementOptions={replacementOptions}
                        onEditDraftChange={setEditDraft}
                        onReplacementChange={setReplacementStatusId}
                        onStartEdit={() => {
                          startEdit(status);
                        }}
                        onCancelEdit={cancelEdit}
                        onSaveEdit={() => {
                          void handleUpdate(status.id);
                        }}
                        onStartDelete={() => {
                          startDelete(status.id);
                        }}
                        onCancelDelete={cancelDelete}
                        onConfirmDelete={() => {
                          void handleDelete();
                        }}
                      />
                    </SortableStatusCard>
                  );
                })}
              </Stack>
            </DragDropProvider>

            <AddStatusForm
              draft={createDraft}
              isBusy={isBusy}
              onChange={setCreateDraft}
              onSubmit={() => {
                void handleCreate();
              }}
            />
          </Stack>
        )}
      </ModalBody>
    </Modal>
  );
};
