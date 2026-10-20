import type { ICommand } from "@pine/common";
import type {
  IPlatformRelationService,
  PlatformRelation,
} from "@/features/platform/services/IPlatformRelationService";

export class GrantPlatformAdmin implements ICommand<string, PlatformRelation> {
  constructor(private readonly platformRelationService: IPlatformRelationService) {}

  async execute(identityId: string): Promise<PlatformRelation> {
    return this.platformRelationService.create(
      {
        relation: "owners",
        identityId,
      },
      identityId,
      { skipAuthorization: true },
    );
  }
}
