import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Identity } from "@/db";
import type { IAuditLogRepository } from "@/features/audit/repositories";
import type {
  AuditLogWithActor,
  IAuditLogService,
  ListAuditLogsInput,
} from "@/features/audit/services/IAuditLogService";
import type { IIdentityRepository } from "@/features/identities/repositories";

@injectable()
export class AuditLogService implements IAuditLogService {
  constructor(
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
    @inject(TYPES.IdentityRepository)
    private readonly identityRepository: IIdentityRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async list(input: ListAuditLogsInput, identityId: string): Promise<AuditLogWithActor[]> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `workspace:${input.workspaceId}`,
    );

    const logs = await this.auditLogRepository.findMany({
      entityType: input.entityType,
      entityId: input.entityId,
    });

    const actorIds: string[] = [];
    const seenActorIds = new Set<string>();
    for (const log of logs) {
      if (log.actorId === null || seenActorIds.has(log.actorId)) {
        continue;
      }
      seenActorIds.add(log.actorId);
      actorIds.push(log.actorId);
    }

    const identities = await this.identityRepository.findByIdentityIds(actorIds);
    const identitiesById = new Map<string, Identity>();
    for (const identity of identities) {
      identitiesById.set(identity.identityId, identity);
    }

    return logs.map((log) => ({
      ...log,
      actor: log.actorId === null ? null : (identitiesById.get(log.actorId) ?? null),
    }));
  }
}
