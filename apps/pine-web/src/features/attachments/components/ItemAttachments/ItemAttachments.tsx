import { Box, Button, Stack, Typography } from "@mui/material";
import { useRef, useState, type ChangeEvent } from "react";
import {
  useCreateItemAttachmentUploadRequestMutation,
  useDeleteItemAttachmentMutation,
  useGetItemAttachmentsQuery,
} from "@generated/gql";
import { ProgressCircularIndicator } from "@pine/ui";
import { useSnackbar } from "@shared";
import { formatFileSize, getAttachmentUrl } from "../../utils";
import { AttachmentCard } from "../AttachmentCard";
import { AttachmentDropZone } from "../AttachmentDropZone";

interface ItemAttachmentsProps {
  itemId: string;
}

const INITIAL_VISIBLE_ATTACHMENTS = 4;

export const ItemAttachments = ({ itemId }: ItemAttachmentsProps) => {
  const snackbar = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAllAttachments, setShowAllAttachments] = useState(false);

  const attachmentsQuery = useGetItemAttachmentsQuery(
    { itemId },
    {
      enabled: Boolean(itemId),
      select: (data) =>
        (data.getItemAttachments ?? []).flatMap((attachment) => {
          if (
            !attachment ||
            typeof attachment.id !== "string" ||
            typeof attachment.attachmentId !== "string" ||
            typeof attachment.name !== "string"
          ) {
            return [];
          }
          return [
            {
              id: attachment.id,
              attachmentId: attachment.attachmentId,
              name: attachment.name,
              mimeType: typeof attachment.mimeType === "string" ? attachment.mimeType : "",
              size: typeof attachment.size === "number" ? attachment.size : null,
            },
          ];
        }),
    },
  );
  const createUploadRequestMutation = useCreateItemAttachmentUploadRequestMutation();
  const deleteAttachmentMutation = useDeleteItemAttachmentMutation();

  const attachments = attachmentsQuery.data ?? [];
  const isPending = createUploadRequestMutation.isPending || isUploading;
  const hasHiddenAttachments = attachments.length > INITIAL_VISIBLE_ATTACHMENTS;
  const visibleAttachments =
    showAllAttachments || !hasHiddenAttachments
      ? attachments
      : attachments.slice(0, INITIAL_VISIBLE_ATTACHMENTS);
  const hiddenAttachmentCount = attachments.length - INITIAL_VISIBLE_ATTACHMENTS;

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      const result = await createUploadRequestMutation.mutateAsync({
        input: {
          itemId,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
        },
      });

      const target = result.createItemAttachmentUploadRequest;
      if (!target?.url) {
        throw new Error("Missing upload target URL");
      }

      const formData = new FormData();
      formData.append("file", file);

      const headers: Record<string, string> = {};
      if (target.headers) {
        for (const item of target.headers) {
          if (item.key && item.value && item.key.toLowerCase() !== "content-type") {
            headers[item.key] = item.value;
          }
        }
      }

      const response = await fetch(target.url, {
        method: "PUT",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      snackbar.success("Attachment uploaded. It will appear after scanning.");

      setTimeout(() => {
        void attachmentsQuery.refetch();
      }, 1000);
      setTimeout(() => {
        void attachmentsQuery.refetch();
      }, 3000);
      setTimeout(() => {
        void attachmentsQuery.refetch();
      }, 8000);
    } catch (error) {
      snackbar.error(
        error instanceof Error ? error.message : "Could not upload attachment. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    void uploadFile(file);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAttachmentMutation.mutateAsync({ id });
      snackbar.success("Attachment removed");
      await attachmentsQuery.refetch();
    } catch (error) {
      snackbar.error(
        error instanceof Error ? error.message : "Could not remove attachment. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Stack spacing={1.5}>
      <input ref={fileInputRef} type="file" hidden onChange={handleSelectFile} />

      <AttachmentDropZone
        isPending={isPending}
        onBrowse={() => {
          fileInputRef.current?.click();
        }}
        onFile={(file) => {
          void uploadFile(file);
        }}
      />

      {attachmentsQuery.isPending && (
        <ProgressCircularIndicator size={32} aria-label="Loading attachments" />
      )}

      {attachmentsQuery.isError && (
        <Typography variant="body2" color="error">
          Failed to load attachments.
        </Typography>
      )}

      {attachmentsQuery.isSuccess && attachments.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No attachments yet.
        </Typography>
      )}

      {attachments.length > 0 && (
        <Stack spacing={1}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(3, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.5,
            }}
          >
            {visibleAttachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                name={attachment.name}
                mimeType={attachment.mimeType}
                sizeLabel={formatFileSize(attachment.size)}
                href={getAttachmentUrl(attachment.attachmentId)}
                isDeleting={deletingId === attachment.id}
                onDelete={() => {
                  void handleDelete(attachment.id);
                }}
              />
            ))}
          </Box>

          {hasHiddenAttachments && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setShowAllAttachments((current) => !current);
                }}
              >
                {showAllAttachments ? "Show less" : `More (${hiddenAttachmentCount})`}
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  );
};
