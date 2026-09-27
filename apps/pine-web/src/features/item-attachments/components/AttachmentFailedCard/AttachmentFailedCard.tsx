import DeleteOutline from "@mui/icons-material/DeleteOutline";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import { alpha, Box, IconButton, Stack, Typography, useTheme } from "@mui/material";

interface AttachmentFailedCardProps {
  name: string;
  sizeLabel: string;
  statusLabel: string;
  isDeleting: boolean;
  onDelete: () => void;
}

export const AttachmentFailedCard = ({
  name,
  sizeLabel,
  statusLabel,
  isDeleting,
  onDelete,
}: AttachmentFailedCardProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
        bgcolor: "background.paper",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        "&:hover .attachment-failed-card-delete": {
          opacity: 1,
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          aspectRatio: "1 / 1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(theme.palette.error.main, 0.12),
          color: "error.main",
          width: "100%",
        }}
      >
        <ErrorOutline sx={{ fontSize: 40 }} />
      </Box>

      <Stack spacing={0.25} sx={{ px: 1.25, py: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          title={name}
          sx={{
            fontWeight: 500,
            color: "text.primary",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </Typography>
        <Typography variant="caption" color="error" noWrap>
          {statusLabel}
          {sizeLabel.length > 0 ? ` · ${sizeLabel}` : ""}
        </Typography>
      </Stack>

      <IconButton
        className="attachment-failed-card-delete"
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
    </Box>
  );
};
