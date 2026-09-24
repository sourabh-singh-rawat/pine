import { builder } from "@pine/server";
import { ListObject } from "./ListObject";

export const PaginatedListObject = builder
  .objectRef<{
    rows: {
      id: string;
      spaceId: string;
      name: string;
    }[];
    rowCount: number;
  }>("PaginatedListObject")
  .implement({
    fields: (t) => ({
      rows: t.field({
        type: [ListObject],
        resolve: (parent) => parent.rows,
      }),
      rowCount: t.exposeFloat("rowCount"),
    }),
  });
