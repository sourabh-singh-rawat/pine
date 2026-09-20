import "reflect-metadata";

import { broker, container, initializeDb, logger, TYPES } from "@/bootstrap";
import type { AuditAttachmentSyncConsumer } from "@/features/attachments";
import type { AuditIdentitySyncConsumer } from "@/features/identities";
import type { AuditIssuesSyncConsumer } from "@/features/items";
import type { AuditPlatformSyncConsumer } from "@/features/workspaces";

export { container, db } from "@/bootstrap";

const main = async () => {
  await initializeDb();
  await broker.init();

  void container.get<AuditIdentitySyncConsumer>(TYPES.AuditIdentitySyncConsumer).start();
  void container.get<AuditIssuesSyncConsumer>(TYPES.AuditIssuesSyncConsumer).start();
  void container.get<AuditPlatformSyncConsumer>(TYPES.AuditPlatformSyncConsumer).start();
  void container.get<AuditAttachmentSyncConsumer>(TYPES.AuditAttachmentSyncConsumer).start();

  logger.info("Audit service started");
};

main().catch((error) => {
  console.log(error);
});
