import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { AuditLog } from "@/db";
import type { IAuditLogRepository } from "@/features/audit/repositories";
import type {
  IAuditLogService,
  ListAuditLogsInput,
} from "@/features/audit/services/IAuditLogService";

@injectable()
export class AuditLogService implements IAuditLogService {
  constructor(
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async list(input: ListAuditLogsInput, identityId: string): Promise<AuditLog[]> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `workspace:${input.workspaceId}`,
    );

    return this.auditLogRepository.findMany({
      entityType: input.entityType,
      entityId: input.entityId,
    });
  }
}
