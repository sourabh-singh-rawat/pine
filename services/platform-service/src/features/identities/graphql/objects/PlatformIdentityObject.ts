import { builder } from "@pine/server";
import type { Identity } from "@/db";

export const PlatformIdentityObject = builder.objectRef<Identity>("PlatformIdentityObject");

PlatformIdentityObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    identityId: t.exposeString("identityId"),
    fullName: t.exposeString("fullName", { nullable: true }),
    displayName: t.field({
      type: "String",
      nullable: true,
      resolve: (identity) => identity.fullName,
    }),
    firstName: t.exposeString("firstName", { nullable: true }),
    middleName: t.exposeString("middleName", { nullable: true }),
    lastName: t.exposeString("lastName", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
    updatedAt: t.expose("updatedAt", { type: "DateTimeISO", nullable: true }),
  }),
});
