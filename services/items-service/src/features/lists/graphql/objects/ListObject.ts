import { builder } from "@pine/server";

export const ListObject = builder
  .objectRef<{
    id: string;
    spaceId: string;
    name: string;
  }>("ListObject")
  .implement({
    fields: (t) => ({
      id: t.exposeString("id"),
      spaceId: t.exposeString("spaceId"),
      name: t.exposeString("name"),
    }),
  });
