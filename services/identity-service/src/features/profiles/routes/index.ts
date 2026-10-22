import type { HttpRoute } from "@pine/server";
import { getProfilePhoto } from "@/features/profiles/routes/getProfilePhoto";
import { uploadProfilePhoto } from "@/features/profiles/routes/uploadProfilePhoto";

export const profileRoutes: HttpRoute[] = [uploadProfilePhoto, getProfilePhoto];
