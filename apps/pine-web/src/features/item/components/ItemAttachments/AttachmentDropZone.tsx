import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { ProgressCircularIndicator } from "@pine/ui";

interface AttachmentDropZoneProps {
  isPending: boolean;
  onBrowse: () => void;
  onFile: (file: File) => void;
}

export const AttachmentDropZone = ({ isPending, onBrowse, onFile }: AttachmentDropZoneProps) => {
  const theme = useTheme();
  const dragDepthRef = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    if (Array.from(event.dataTransfer.types).includes("Files")) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragActive(false);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragActive(false);

    if (isPending) {
      return;
    }

    const file = event.dataTransfer.files.item(0);
    if (!file) {
      return;
    }

    onFile(file);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isPending) {
        onBrowse();
      }
    }
  };

  return (
    <Box
      role="button"
      tabIndex={isPending ? -1 : 0}
      aria-disabled={isPending}
      aria-label={
        isPending ? "Uploading attachment" : "Drop a file to upload, or press Enter to browse"
      }
      onClick={() => {
        if (!isPending) {
          onBrowse();
        }
      }}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        px: 2,
        py: 3,
        borderRadius: 2,
        border: `1px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
        bgcolor: isDragActive ? "action.selected" : "action.hover",
        cursor: isPending ? "progress" : "pointer",
        outline: "none",
        transition: theme.transitions.create(["border-color", "background-color"]),
        opacity: isPending ? 0.7 : 1,
        "&:hover": {
          borderColor: isPending ? undefined : "primary.main",
          bgcolor: isPending ? undefined : "action.selected",
        },
        "&:focus-visible": {
          borderColor: "primary.main",
          boxShadow: `0 0 0 2px ${theme.palette.primary.main}33`,
        },
      }}
    >
      {isPending ? (
        <ProgressCircularIndicator size={28} aria-label="Uploading attachment" />
      ) : (
        <CloudUploadOutlined color={isDragActive ? "primary" : "action"} sx={{ fontSize: 32 }} />
      )}
      <Stack spacing={0.25} alignItems="center">
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: isDragActive ? "primary.main" : "text.primary",
          }}
        >
          {isPending ? "Uploading…" : isDragActive ? "Drop to upload" : "Drag and drop a file here"}
        </Typography>
        {!isPending && !isDragActive && (
          <Typography variant="caption" color="text.secondary">
            or click to browse
          </Typography>
        )}
      </Stack>
    </Box>
  );
};
