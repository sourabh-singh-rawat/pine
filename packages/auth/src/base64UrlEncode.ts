export const base64UrlEncode = (bytes: Uint8Array): string => {
  const binary = String.fromCodePoint(...bytes);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};
