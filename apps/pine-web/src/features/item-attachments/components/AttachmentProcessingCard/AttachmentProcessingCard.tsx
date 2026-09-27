import { Box, Skeleton, Stack, Typography, useTheme } from "@mui/material";

interface AttachmentProcessingCardProps {
  name: string;
  sizeLabel: string;
  statusLabel: string;
}

export const AttachmentProcessingCard = ({
  name,
  sizeLabel,
  statusLabel,
}: AttachmentProcessingCardProps) => {
  const theme = useTheme();

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
      }}
    >
      <Box
        aria-hidden
        sx={{
          aspectRatio: "1 / 1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "action.hover",
          width: "100%",
          p: 1.5,
        }}
      >
        <Skeleton
          variant="rounded"
          animation="wave"
          sx={{ width: "100%", height: "100%", borderRadius: 1.5 }}
        />
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
        <Typography variant="caption" color="text.secondary" noWrap>
          {statusLabel}
          {sizeLabel.length > 0 ? ` · ${sizeLabel}` : ""}
        </Typography>
      </Stack>
    </Box>
  );
};
