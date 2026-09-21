import { builder } from "@pine/server";

export const ProjectObject = builder
  .objectRef<{
    id: string;
    spaceId: string;
    name: string;
  }>("ProjectObject")
  .implement({
    fields: (t) => ({
      id: t.exposeString("id"),
      spaceId: t.exposeString("spaceId"),
      name: t.exposeString("name"),
    }),
  });
