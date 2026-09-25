import { useRef, useState, type ChangeEvent } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useGetCurrentUserQuery } from "@generated/api/@tanstack/react-query.gen";
import { useCreatePhotoUploadRequestMutation } from "@generated/gql/hooks";
import { isMeProfile } from "@features/home/utils";
import { getErrorMessage, useSnackbar } from "@shared/ui";

type ProfilePhotoBlockProps = {
  photoUrl?: string | null;
  fullName?: string | null;
};

export const ProfilePhotoBlock = ({ photoUrl, fullName }: ProfilePhotoBlockProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const snackbar = useSnackbar();
  const currentUserQuery = useGetCurrentUserQuery();
  const createPhotoUploadRequestMutation = useCreatePhotoUploadRequestMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const identityId = currentUserQuery.data?.identity?.id;

  const rawProfile = currentUserQuery.data?.profile;
  const profile = isMeProfile(rawProfile) ? rawProfile : null;

  const isPending = createPhotoUploadRequestMutation.isPending || isUploading;
  const activePhotoUrl = previewUrl ?? photoUrl ?? profile?.photoUrl ?? undefined;
  const displayName = fullName ?? profile?.fullName ?? "";

  const handleSelectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!identityId) {
      snackbar.error("Sign in to upload a profile photo.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      const result = await createPhotoUploadRequestMutation.mutateAsync({
        input: {
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
        },
      });

      const target = result.createPhotoUploadRequest;
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

      snackbar.success("Profile photo uploaded.");

      setTimeout(() => {
        void currentUserQuery.refetch();
      }, 1000);
      setTimeout(() => {
        void currentUserQuery.refetch();
      }, 3000);
    } catch (error) {
      setPreviewUrl(null);
      snackbar.error(getErrorMessage(error, "Could not upload profile photo. Please try again."));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 3,
          px: 3,
          py: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
          <Avatar
            src={activePhotoUrl}
            alt={displayName || "Profile photo"}
            sx={{
              width: 56,
              height: 56,
              fontSize: "1.25rem",
              fontWeight: 500,
              bgcolor: "primary.main",
            }}
          >
            {displayName.slice(0, 1).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Profile photo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A photo helps personalize your account
            </Typography>
          </Box>
        </Box>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleSelectFile} />
        <Button
          variant="outlined"
          size="small"
          disabled={isPending}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          {isPending ? "Uploading…" : activePhotoUrl ? "Change" : "Upload"}
        </Button>
      </Box>
    </Paper>
  );
};
