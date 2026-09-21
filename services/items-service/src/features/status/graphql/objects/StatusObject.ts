import { builder } from "@pine/server";

export const StatusObject = builder
  .objectRef<{
    id: string;
    name: string;
  }>("StatusObject")
  .implement({
    fields: (t) => ({
      id: t.exposeString("id"),
      name: t.exposeString("name"),
    }),
  });
