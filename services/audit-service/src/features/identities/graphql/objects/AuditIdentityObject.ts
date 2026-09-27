import { builder } from "@pine/server";
import type { Identity } from "@/db";

export const AuditIdentityObject = builder.objectRef<Identity>("AuditIdentityObject");

AuditIdentityObject.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (identity) => identity.identityId,
    }),
    fullName: t.exposeString("fullName", { nullable: true }),
    firstName: t.exposeString("firstName", { nullable: true }),
    middleName: t.exposeString("middleName", { nullable: true }),
    lastName: t.exposeString("lastName", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
    updatedAt: t.expose("updatedAt", { type: "DateTimeISO", nullable: true }),
  }),
});
