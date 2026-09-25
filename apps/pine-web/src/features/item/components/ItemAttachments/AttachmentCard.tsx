import DeleteOutline from "@mui/icons-material/DeleteOutline";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import PictureAsPdfOutlined from "@mui/icons-material/PictureAsPdfOutlined";
import { Box, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { useState, type ReactElement } from "react";
import { AttachmentLightbox, type AttachmentLightboxKind } from "./AttachmentLightbox";
import { isImageMimeType, isPdfAttachment } from "./attachmentUtils";

interface AttachmentCardProps {
  name: string;
  mimeType: string;
  sizeLabel: string;
  href: string;
  isDeleting: boolean;
  onDelete: () => void;
}

const FileTypeIcon = ({
  mimeType,
  name,
}: {
  mimeType: string;
  name: string;
}): ReactElement => {
  if (isPdfAttachment(mimeType, name)) {
    return <PictureAsPdfOutlined color="error" sx={{ fontSize: 40 }} />;
  }
  return <InsertDriveFileOutlined color="action" sx={{ fontSize: 40 }} />;
};

const previewSurfaceSx = {
  aspectRatio: "1 / 1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: "action.hover",
  border: 0,
  p: 0,
  m: 0,
  overflow: "hidden",
  width: "100%",
};

export const AttachmentCard = ({
  name,
  mimeType,
  sizeLabel,
  href,
  isDeleting,
  onDelete,
}: AttachmentCardProps) => {
  const theme = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isPdf = isPdfAttachment(mimeType, name);
  const showImage = isImageMimeType(mimeType) && !imageFailed;
  const lightboxKind: AttachmentLightboxKind | null = showImage
    ? "image"
    : isPdf
      ? "pdf"
      : null;

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        "&:hover .attachment-card-delete": {
          opacity: 1,
        },
      }}
    >
      {showImage ? (
        <Box
          component="button"
          type="button"
          aria-label={`Preview ${name}`}
          onClick={() => {
            setLightboxOpen(true);
          }}
          sx={{
            ...previewSurfaceSx,
            cursor: "zoom-in",
          }}
        >
          <Box
            component="img"
            src={href}
            alt={name}
            loading="lazy"
            onError={() => {
              setImageFailed(true);
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              pointerEvents: "none",
            }}
          />
        </Box>
      ) : lightboxKind === "pdf" ? (
        <Box
          component="button"
          type="button"
          aria-label={`Preview ${name}`}
          onClick={() => {
            setLightboxOpen(true);
          }}
          sx={{
            ...previewSurfaceSx,
            cursor: "zoom-in",
            color: "inherit",
          }}
        >
          <FileTypeIcon mimeType={mimeType} name={name} />
        </Box>
      ) : (
        <Box
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${name}`}
          sx={{
            ...previewSurfaceSx,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <FileTypeIcon mimeType={mimeType} name={name} />
        </Box>
      )}

      <Stack spacing={0.25} sx={{ px: 1.25, py: 1, minWidth: 0 }}>
        <Typography
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          variant="body2"
          title={name}
          sx={{
            fontWeight: 500,
            color: "text.primary",
            textDecoration: "none",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            "&:hover": {
              color: "primary.main",
            },
          }}
        >
          {name}
        </Typography>
        {sizeLabel.length > 0 && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {sizeLabel}
          </Typography>
        )}
      </Stack>

      <IconButton
        className="attachment-card-delete"
        aria-label={`Remove ${name}`}
        size="small"
        disabled={isDeleting}
        onClick={onDelete}
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          opacity: { xs: 1, sm: 0 },
          transition: theme.transitions.create("opacity"),
          bgcolor: "background.paper",
          boxShadow: 1,
          "&:hover": {
            bgcolor: "background.paper",
          },
        }}
      >
        <DeleteOutline fontSize="small" />
      </IconButton>

      {lightboxKind !== null && (
        <AttachmentLightbox
          open={lightboxOpen}
          name={name}
          href={href}
          kind={lightboxKind}
          onClose={() => {
            setLightboxOpen(false);
          }}
        />
      )}
    </Box>
  );
};
