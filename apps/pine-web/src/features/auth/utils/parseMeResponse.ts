import type { AuthUser } from "../store";

type MeIdentity = {
  id: string;
  email: string;
  emailVerified?: boolean;
};

type MeProfile = {
  fullName: string;
  photoUrl?: string | null;
  description?: string | null;
};

const isOptionalString = (value: unknown): value is string | null | undefined =>
  value === undefined || value === null || typeof value === "string";

const getIdentity = (data: unknown): MeIdentity | null => {
  if (typeof data !== "object" || data === null || !("identity" in data)) {
    return null;
  }

  const identity = data.identity;
  if (typeof identity !== "object" || identity === null) {
    return null;
  }
  if (!("id" in identity) || !("email" in identity)) {
    return null;
  }
  if (typeof identity.id !== "string" || typeof identity.email !== "string") {
    return null;
  }

  const emailVerified =
    "emailVerified" in identity && typeof identity.emailVerified === "boolean"
      ? identity.emailVerified
      : undefined;

  return { id: identity.id, email: identity.email, emailVerified };
};

const getProfile = (data: unknown): MeProfile | null => {
  if (typeof data !== "object" || data === null || !("profile" in data)) {
    return null;
  }

  const profile = data.profile;
  if (typeof profile !== "object" || profile === null) {
    return null;
  }
  if (!("fullName" in profile) || typeof profile.fullName !== "string") {
    return null;
  }

  const photoUrl = "photoUrl" in profile ? profile.photoUrl : undefined;
  const description = "description" in profile ? profile.description : undefined;
  if (!isOptionalString(photoUrl) || !isOptionalString(description)) {
    return null;
  }

  return {
    fullName: profile.fullName,
    photoUrl,
    description,
  };
};

export const toAuthUserFromMeResponse = (data: unknown): AuthUser | null => {
  const identity = getIdentity(data);
  if (!identity) {
    return null;
  }

  const profile = getProfile(data);

  return {
    userId: identity.id,
    email: identity.email,
    emailVerified: identity.emailVerified,
    displayName: profile?.fullName || identity.email,
    photoUrl: profile?.photoUrl ?? null,
    description: profile?.description ?? null,
  };
};
