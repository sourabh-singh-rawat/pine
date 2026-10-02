import { Configuration, OAuth2Api } from "@ory/hydra-client";
import { env } from "@/bootstrap/env";

export class HydraClient {
  readonly publicUrl: string;
  readonly publicConfiguration: Configuration;
  readonly adminConfiguration: Configuration;
  readonly publicApi: OAuth2Api;
  readonly adminApi: OAuth2Api;

  constructor(publicUrl: string = env.HYDRA_PUBLIC_URL, adminUrl: string = env.HYDRA_ADMIN_URL) {
    this.publicUrl = publicUrl;
    this.publicConfiguration = new Configuration({ basePath: publicUrl });
    this.adminConfiguration = new Configuration({ basePath: adminUrl });
    this.publicApi = new OAuth2Api(this.publicConfiguration);
    this.adminApi = new OAuth2Api(this.adminConfiguration);
  }
}
