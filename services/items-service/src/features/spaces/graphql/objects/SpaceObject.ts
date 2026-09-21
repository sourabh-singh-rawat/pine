import { builder } from "@pine/server";
import type { Space } from "@/db";

export const SpaceObject = builder.objectRef<Space>("SpaceObject").implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    workspaceId: t.exposeString("workspaceId"),
    name: t.exposeString("name"),
    createdById: t.exposeString("createdById"),
    createdAt: t.expose("createdAt", { type: "DateTimeISO" }),
    updatedAt: t.expose("updatedAt", { type: "DateTimeISO", nullable: true }),
  }),
});
