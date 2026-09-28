import { applySecrets } from "./applySecrets";
import { fetchSecrets } from "./fetchSecrets";
import { shouldLoadDevSecrets } from "./shouldLoadDevSecrets";
import type { SecretOptions, Secrets } from "./types";

export const loadSecrets = async (options: SecretOptions): Promise<Secrets> => {
  if (!shouldLoadDevSecrets()) {
    return {};
  }

  const secrets = await fetchSecrets(options);
  return applySecrets(secrets, options.app);
};
