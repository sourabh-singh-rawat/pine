import Close from "@mui/icons-material/Close";
import OpenInNew from "@mui/icons-material/OpenInNew";
import { Box, IconButton, Modal, Stack, Typography, useTheme } from "@mui/material";

export type AttachmentLightboxKind = "image" | "pdf";

interface AttachmentLightboxProps {
  open: boolean;
  name: string;
  href: string;
  kind: AttachmentLightboxKind;
  onClose: () => void;
}

export const AttachmentLightbox = ({
  open,
  name,
  href,
  kind,
  onClose,
}: AttachmentLightboxProps) => {
  const theme = useTheme();
  const previewMaxHeight = "calc(92vh - 56px)";

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-label={`Preview ${name}`}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Box
        sx={{
          position: "relative",
          outline: "none",
          width: kind === "pdf" ? "min(96vw, 1200px)" : undefined,
          maxWidth: "min(96vw, 1200px)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            color: "common.white",
            minWidth: 0,
          }}
        >
          <Typography
            variant="subtitle1"
            title={name}
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textShadow: "0 1px 2px rgba(0,0,0,0.6)",
            }}
          >
            {name}
          </Typography>
          <IconButton
            component="a"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${name} in new tab`}
            size="small"
            sx={{
              color: "common.white",
              bgcolor: "rgba(0,0,0,0.45)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
            }}
          >
            <OpenInNew fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="Close preview"
            size="small"
            onClick={onClose}
            sx={{
              color: "common.white",
              bgcolor: "rgba(0,0,0,0.45)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Stack>

        {kind === "pdf" ? (
          <Box
            component="iframe"
            title={name}
            src={href}
            sx={{
              display: "block",
              width: "100%",
              height: previewMaxHeight,
              border: 0,
              borderRadius: 1.5,
              boxShadow: theme.shadows[24],
              bgcolor: "common.white",
            }}
          />
        ) : (
          <Box
            component="img"
            src={href}
            alt={name}
            sx={{
              display: "block",
              maxWidth: "100%",
              maxHeight: previewMaxHeight,
              objectFit: "contain",
              borderRadius: 1.5,
              boxShadow: theme.shadows[24],
              bgcolor: "rgba(0,0,0,0.35)",
            }}
          />
        )}
      </Box>
    </Modal>
  );
};
