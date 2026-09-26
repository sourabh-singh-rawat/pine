import { builder } from "@pine/server";

export const StatusObject = builder
  .objectRef<{
    id: string;
    name: string;
    type: string;
    color: string;
    orderIndex: number;
    listId: string;
  }>("StatusObject")
  .implement({
    fields: (t) => ({
      id: t.exposeString("id"),
      name: t.exposeString("name"),
      type: t.exposeString("type"),
      color: t.exposeString("color"),
      orderIndex: t.exposeInt("orderIndex"),
      listId: t.exposeString("listId"),
    }),
  });
