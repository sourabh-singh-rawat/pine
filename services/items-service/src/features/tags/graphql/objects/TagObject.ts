import { builder } from "@pine/server";

export const TagObject = builder
  .objectRef<{
    id: string;
    workspaceId: string;
    spaceId?: string | null;
    name: string;
    color: string;
    description?: string | null;
  }>("TagObject")
  .implement({
    fields: (t) => ({
      id: t.exposeString("id", { nullable: false }),
      workspaceId: t.exposeString("workspaceId", { nullable: false }),
      spaceId: t.exposeString("spaceId", { nullable: true }),
      name: t.exposeString("name", { nullable: false }),
      color: t.exposeString("color", { nullable: false }),
      description: t.exposeString("description", { nullable: true }),
    }),
  });
