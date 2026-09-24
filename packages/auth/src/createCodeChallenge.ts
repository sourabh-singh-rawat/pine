import { base64UrlEncode } from "./base64UrlEncode";

export const createCodeChallenge = async (): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> => {
  const random = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = base64UrlEncode(random);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const codeChallenge = base64UrlEncode(new Uint8Array(digest));
  return { codeVerifier, codeChallenge };
};
