import fs from "node:fs";
import https from "node:https";

import { resolveSecretRequest } from "./credentials";
import { parseKvSecretPayload } from "./parse";
import type { SecretOptions, Secrets } from "./types";

export const fetchSecrets = async (options: SecretOptions): Promise<Secrets> => {
  const request = resolveSecretRequest(options);
  if (!request) {
    throw new Error(
      `OpenBao app token for "${options.app}" not found. Ensure .local/openbao/credentials.json has app_tokens (run pnpm openbao:bootstrap).`,
    );
  }

  const agent = request.caPath
    ? new https.Agent({ ca: fs.readFileSync(request.caPath), rejectUnauthorized: true })
    : undefined;
  const url = new URL(`/v1/${request.secretPath}`, request.openbaoUrl);

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "GET",
        agent,
        servername: "openbao",
        headers: { "X-Vault-Token": request.token },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk: Buffer) => {
          raw += chunk.toString("utf8");
        });
        res.on("end", () => {
          if (res.statusCode === 404) {
            resolve({});
            return;
          }
          if (res.statusCode !== 200) {
            reject(
              new Error(
                `Failed to fetch secrets from OpenBao at ${url.pathname}: HTTP ${res.statusCode} - ${raw}`,
              ),
            );
            return;
          }
          try {
            resolve(parseKvSecretPayload(JSON.parse(raw)));
          } catch (err: unknown) {
            reject(new Error(`Failed to parse OpenBao response: ${String(err)}`));
          }
        });
      },
    );

    req.on("error", (err) => reject(err));
    req.end();
  });
};
