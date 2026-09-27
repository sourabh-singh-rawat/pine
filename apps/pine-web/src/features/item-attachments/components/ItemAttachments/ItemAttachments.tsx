import { Box, Button, Stack, Typography } from "@mui/material";
import { useRef, useState, type ChangeEvent } from "react";
import {
  useCreateItemAttachmentUploadRequestMutation,
  useDeleteItemAttachmentMutation,
  useGetItemAttachmentsQuery,
} from "@generated/gql";
import { ProgressCircularIndicator } from "@pine/ui";
import { useSnackbar } from "@shared";
import { ITEM_ATTACHMENT_STATUS, isProcessingAttachmentStatus } from "../../constants";
import {
  formatFileSize,
  getAttachmentDerivativeUrl,
  getAttachmentUrl,
  isImageMimeType,
} from "../../utils";
import { AttachmentCard } from "../AttachmentCard";
import { AttachmentDropZone } from "../AttachmentDropZone";
import { AttachmentFailedCard } from "../AttachmentFailedCard";
import { AttachmentProcessingCard } from "../AttachmentProcessingCard";

interface ItemAttachmentsProps {
  itemId: string;
}

const INITIAL_VISIBLE_ATTACHMENTS = 4;

type AttachmentListItem = {
  id: string;
  attachmentId: string | null;
  status: string;
  processingLabel: string | null;
  name: string;
  mimeType: string;
  size: number | null;
};

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
      refetchInterval: (query) => {
        const rows = query.state.data?.getItemAttachments;
        if (!Array.isArray(rows)) {
          return false;
        }
        const hasProcessing = rows.some(
          (attachment) =>
            typeof attachment?.status === "string" &&
            isProcessingAttachmentStatus(attachment.status),
        );
        return hasProcessing ? 2000 : false;
      },
      select: (data): AttachmentListItem[] =>
        (data.getItemAttachments ?? []).flatMap((attachment) => {
          if (
            !attachment ||
            typeof attachment.id !== "string" ||
            typeof attachment.name !== "string" ||
            typeof attachment.status !== "string"
          ) {
            return [];
          }
          return [
            {
              id: attachment.id,
              attachmentId:
                typeof attachment.attachmentId === "string" ? attachment.attachmentId : null,
              status: attachment.status,
              processingLabel:
                typeof attachment.processing?.label === "string"
                  ? attachment.processing.label
                  : null,
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
    let uploadRequestId: string | null = null;

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
      if (typeof target?.uploadRequestId === "string") {
        uploadRequestId = target.uploadRequestId;
      }
      if (!target?.url) {
        throw new Error("Missing upload target URL");
      }

      await attachmentsQuery.refetch();

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
      await attachmentsQuery.refetch();
    } catch (error) {
      if (uploadRequestId !== null) {
        await deleteAttachmentMutation.mutateAsync({ id: uploadRequestId }).catch(() => undefined);
        await attachmentsQuery.refetch();
      }
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
            {visibleAttachments.map((attachment) => {
              if (attachment.status === ITEM_ATTACHMENT_STATUS.FAILED) {
                return (
                  <AttachmentFailedCard
                    key={attachment.id}
                    name={attachment.name}
                    sizeLabel={formatFileSize(attachment.size)}
                    statusLabel={attachment.processingLabel ?? "Scan failed"}
                    isDeleting={deletingId === attachment.id}
                    onDelete={() => {
                      void handleDelete(attachment.id);
                    }}
                  />
                );
              }

              if (isProcessingAttachmentStatus(attachment.status) || !attachment.attachmentId) {
                return (
                  <AttachmentProcessingCard
                    key={attachment.id}
                    name={attachment.name}
                    sizeLabel={formatFileSize(attachment.size)}
                    statusLabel={attachment.processingLabel ?? "Processing…"}
                  />
                );
              }

              const href = getAttachmentUrl(attachment.attachmentId);
              const previewHref = isImageMimeType(attachment.mimeType)
                ? getAttachmentDerivativeUrl(attachment.attachmentId, "thumbnail")
                : undefined;

              return (
                <AttachmentCard
                  key={attachment.id}
                  name={attachment.name}
                  mimeType={attachment.mimeType}
                  sizeLabel={formatFileSize(attachment.size)}
                  href={href}
                  previewHref={previewHref}
                  isDeleting={deletingId === attachment.id}
                  onDelete={() => {
                    void handleDelete(attachment.id);
                  }}
                />
              );
            })}
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
