import type { OAuthSetCookie } from "@/integrations/oauth/IOAuthFlowProvider";

export const parseSetCookieHeader = (header: string): OAuthSetCookie | undefined => {
  const segments = header.split(";").map((part) => part.trim());
  const [nameValue, ...attributes] = segments;
  if (!nameValue) {
    return undefined;
  }

  const separator = nameValue.indexOf("=");
  if (separator <= 0) {
    return undefined;
  }

  const cookie: OAuthSetCookie = {
    name: nameValue.slice(0, separator),
    value: nameValue.slice(separator + 1),
    path: "/",
  };

  for (const attribute of attributes) {
    const attributeSeparator = attribute.indexOf("=");
    const rawKey = attributeSeparator === -1 ? attribute : attribute.slice(0, attributeSeparator);
    const rawValue =
      attributeSeparator === -1 ? undefined : attribute.slice(attributeSeparator + 1);
    const key = rawKey.trim().toLowerCase();
    const value = rawValue?.trim();

    if (key === "path") {
      cookie.path = value?.startsWith("/oauth2") ? "/" : (value ?? "/");
      continue;
    }
    if (key === "httponly") {
      cookie.httpOnly = true;
      continue;
    }
    if (key === "secure") {
      cookie.secure = true;
      continue;
    }
    if (key === "samesite" && value) {
      const sameSite = value.toLowerCase();
      if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
        cookie.sameSite = sameSite;
      }
      continue;
    }
    if (key === "max-age" && value) {
      const maxAge = Number(value);
      if (Number.isFinite(maxAge)) {
        cookie.maxAge = maxAge;
      }
    }
  }

  return cookie;
};
