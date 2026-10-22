export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export type ProfilePhotoContentType = "image/jpeg" | "image/png" | "image/webp";

export const profilePhotoContentType = (value: string): ProfilePhotoContentType | null => {
  const contentType = value.split(";")[0]?.trim().toLowerCase();
  if (contentType === "image/jpeg" || contentType === "image/png" || contentType === "image/webp") {
    return contentType;
  }
  return null;
};
