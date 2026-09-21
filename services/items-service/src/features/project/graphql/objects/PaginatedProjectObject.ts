import { builder } from "@pine/server";
import { ProjectObject } from "./ProjectObject";

export const PaginatedProjectObject = builder
  .objectRef<{
    rows: {
      id: string;
      spaceId: string;
      name: string;
    }[];
    rowCount: number;
  }>("PaginatedProjectObject")
  .implement({
    fields: (t) => ({
      rows: t.field({
        type: [ProjectObject],
        resolve: (parent) => parent.rows,
      }),
      rowCount: t.exposeFloat("rowCount"),
    }),
  });
