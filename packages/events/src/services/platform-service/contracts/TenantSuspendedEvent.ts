import { defineEvent } from "../../../cloud-events";
import { TenantSuspendedDataSchema } from "../schemas";

export const TenantSuspendedEvent = defineEvent({
  type: "platform.tenant.suspended",
  version: 1,
  schema: TenantSuspendedDataSchema,
});
