import { uuidv7 } from "@pine/common";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { ClientNotFoundError } from "@/features/clients/errors";
import type {
  ClientDetails,
  CreateClientInput,
  IClientService,
} from "@/features/clients/services/IClientService";
import type { IOAuthClientProvider, RegisteredOAuthClient } from "@/integrations/oauth";

@injectable()
export class ClientService implements IClientService {
  constructor(
    @inject(TYPES.OAuthClientProvider)
    private readonly oauthClientProvider: IOAuthClientProvider,
  ) {}

  async createClient(input: CreateClientInput): Promise<ClientDetails> {
    const registered = await this.oauthClientProvider.registerClient({
      clientId: uuidv7(),
      name: input.name,
      redirectUris: input.redirectUris ?? [],
      grantTypes: input.grantTypes,
      scopes: input.scopes ?? [],
    });

    return this.toClientDetails(registered);
  }

  async getClientById(id: string): Promise<ClientDetails | null> {
    const client = await this.oauthClientProvider.getClient(id);
    if (!client) {
      return null;
    }
    return this.toClientDetails(client);
  }

  async deleteClientById(id: string): Promise<void> {
    const client = await this.oauthClientProvider.getClient(id);
    if (!client) {
      throw new ClientNotFoundError(id);
    }

    await this.oauthClientProvider.deleteClient(id);
  }

  private toClientDetails(client: RegisteredOAuthClient): ClientDetails {
    return {
      id: client.clientId,
      name: client.name ?? client.clientId,
      redirectUris: client.redirectUris ?? [],
      scopes: client.scopes ?? [],
      grantTypes: client.grantTypes ?? [],
    };
  }
}
