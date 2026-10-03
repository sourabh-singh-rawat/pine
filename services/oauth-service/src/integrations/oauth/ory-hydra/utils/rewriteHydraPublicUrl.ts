const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

export const rewriteHydraPublicUrl = (
  url: string,
  hydraPublicUrl: string,
  oauthPublicUrl: string,
): string => {
  let parsed: URL;
  let hydraBase: URL;
  try {
    parsed = new URL(url);
    hydraBase = new URL(hydraPublicUrl);
  } catch {
    return url;
  }

  if (parsed.origin !== hydraBase.origin) {
    return url;
  }

  const pathname = trimTrailingSlash(parsed.pathname);
  if (pathname !== "/oauth2/auth") {
    return url;
  }

  const publicBase = trimTrailingSlash(oauthPublicUrl);
  return `${publicBase}/authorize${parsed.search}${parsed.hash}`;
};
