import { builder } from "@pine/server";

export const TagObject = builder
  .objectRef<{
    id: string;
    organizationId: string;
    spaceId?: string | null;
    name: string;
    color: string;
    description?: string | null;
  }>("TagObject")
  .implement({
    fields: (t) => ({
      id: t.exposeString("id", { nullable: false }),
      organizationId: t.exposeString("organizationId", { nullable: false }),
      spaceId: t.exposeString("spaceId", { nullable: true }),
      name: t.exposeString("name", { nullable: false }),
      color: t.exposeString("color", { nullable: false }),
      description: t.exposeString("description", { nullable: true }),
    }),
  });
