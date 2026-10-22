import { env } from "@/bootstrap/env";

export const toMeProfilePhotoUrl = (photoUrl?: string | null): string | null => {
  if (!photoUrl) {
    return null;
  }
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }
  const cleanPath = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
  return `${env.API_PUBLIC_URL.replace(/\/$/, "")}${cleanPath}`;
};
