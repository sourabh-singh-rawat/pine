import DeleteOutline from "@mui/icons-material/DeleteOutline";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import { Box, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { useState } from "react";
import { AttachmentLightbox } from "./AttachmentLightbox";

interface AttachmentCardProps {
  name: string;
  mimeType: string;
  sizeLabel: string;
  href: string;
  isDeleting: boolean;
  onDelete: () => void;
}

const isImageMimeType = (mimeType: string): boolean =>
  mimeType.toLowerCase().startsWith("image/");

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
  const showImage = isImageMimeType(mimeType) && !imageFailed;

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
            aspectRatio: "1 / 1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "action.hover",
            border: 0,
            p: 0,
            m: 0,
            cursor: "zoom-in",
            overflow: "hidden",
            width: "100%",
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
      ) : (
        <Box
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${name}`}
          sx={{
            aspectRatio: "1 / 1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "action.hover",
            textDecoration: "none",
            color: "inherit",
            overflow: "hidden",
          }}
        >
          <InsertDriveFileOutlined color="action" sx={{ fontSize: 40 }} />
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

      {showImage && (
        <AttachmentLightbox
          open={lightboxOpen}
          name={name}
          href={href}
          onClose={() => {
            setLightboxOpen(false);
          }}
        />
      )}
    </Box>
  );
};
