import DeleteOutline from "@mui/icons-material/DeleteOutline";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useRef, useState, type ChangeEvent } from "react";
import {
  useCreateItemAttachmentUploadRequestMutation,
  useDeleteItemAttachmentMutation,
  useGetItemAttachmentsQuery,
} from "@generated/gql";
import { ProgressCircularIndicator } from "@pine/ui";
import { useSnackbar } from "@shared";

interface ItemAttachmentsProps {
  itemId: string;
}

const formatFileSize = (size: number | null | undefined): string => {
  if (size === null || size === undefined || size <= 0) {
    return "";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getAttachmentUrl = (attachmentId: string): string => {
  const base =
    import.meta.env.VITE_DATA_GATEWAY_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "https://localhost:4001";
  return `${base.replace(/\/$/, "")}/attachments/${attachmentId}`;
};

export const ItemAttachments = ({ itemId }: ItemAttachmentsProps) => {
  const theme = useTheme();
  const snackbar = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const attachmentsQuery = useGetItemAttachmentsQuery(
    { itemId },
    {
      enabled: Boolean(itemId),
      select: (data) => data.getItemAttachments ?? [],
    },
  );
  const createUploadRequestMutation = useCreateItemAttachmentUploadRequestMutation();
  const deleteAttachmentMutation = useDeleteItemAttachmentMutation();

  const attachments = attachmentsQuery.data ?? [];
  const isPending =
    createUploadRequestMutation.isPending || isUploading;

  const handleSelectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

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
        error instanceof Error
          ? error.message
          : "Could not upload attachment. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAttachmentMutation.mutateAsync({ id });
      snackbar.success("Attachment removed");
      await attachmentsQuery.refetch();
    } catch (error) {
      snackbar.error(
        error instanceof Error
          ? error.message
          : "Could not remove attachment. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleSelectFile}
        />
        <Button
          variant="outlined"
          size="small"
          disabled={isPending}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          {isPending ? "Uploading…" : "Upload"}
        </Button>
        {isPending && (
          <ProgressCircularIndicator size={24} aria-label="Uploading attachment" />
        )}
      </Stack>

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

      {attachments.map((attachment) => (
        <Stack
          key={attachment.id}
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <InsertDriveFileOutlined color="action" fontSize="small" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component="a"
              href={getAttachmentUrl(attachment.attachmentId)}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              sx={{
                fontWeight: 500,
                color: "primary.main",
                textDecoration: "none",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {attachment.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {[attachment.mimeType, formatFileSize(attachment.size)]
                .filter((part) => part.length > 0)
                .join(" · ")}
            </Typography>
          </Box>
          <IconButton
            aria-label={`Remove ${attachment.name}`}
            size="small"
            disabled={deletingId === attachment.id}
            onClick={() => {
              void handleDelete(attachment.id);
            }}
          >
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Stack>
      ))}
    </Stack>
  );
};
