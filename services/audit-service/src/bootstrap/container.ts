import { Container } from "inversify";
import { broker } from "@/bootstrap/broker";
import { TYPES } from "@/bootstrap/container-types";
import { db } from "@/bootstrap/db";
import { logger } from "@/bootstrap/logger";
import { type IAuditLogRepository, AuditLogRepository } from "@/features/audit";
import { type IIdentityRepository, IdentityRepository, AuditIdentitySyncConsumer } from "@/features/identities";
import { type IItemRepository, ItemRepository, AuditIssuesSyncConsumer } from "@/features/items";
import { type ISpaceRepository, SpaceRepository } from "@/features/spaces";
import { type IWorkspaceRepository, WorkspaceRepository, AuditPlatformSyncConsumer } from "@/features/workspaces";
import { type IAttachmentRepository, AttachmentRepository, AuditAttachmentSyncConsumer } from "@/features/attachments";

export const container = new Container({ defaultScope: "Singleton" });

container.bind(TYPES.Database).toConstantValue(db);
container.bind(TYPES.Logger).toConstantValue(logger);
container.bind(TYPES.Broker).toConstantValue(broker);

container.bind<IAuditLogRepository>(TYPES.AuditLogRepository).to(AuditLogRepository);
container.bind<IIdentityRepository>(TYPES.IdentityRepository).to(IdentityRepository);
container.bind<ISpaceRepository>(TYPES.SpaceRepository).to(SpaceRepository);
container.bind<IItemRepository>(TYPES.ItemRepository).to(ItemRepository);
container.bind<IWorkspaceRepository>(TYPES.WorkspaceRepository).to(WorkspaceRepository);
container.bind<IAttachmentRepository>(TYPES.AttachmentRepository).to(AttachmentRepository);

container.bind(TYPES.AuditIdentitySyncConsumer).to(AuditIdentitySyncConsumer);
container.bind(TYPES.AuditIssuesSyncConsumer).to(AuditIssuesSyncConsumer);
container.bind(TYPES.AuditPlatformSyncConsumer).to(AuditPlatformSyncConsumer);
container.bind(TYPES.AuditAttachmentSyncConsumer).to(AuditAttachmentSyncConsumer);
