import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IListService } from "@/features/lists";
import { PaginatedListObject } from "../objects/PaginatedListObject";

builder.queryFields((t) => ({
  getLists: t.field({
    type: PaginatedListObject,
    args: {
      spaceId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { spaceId }, ctx) => {
      const service = container.get<IListService>(TYPES.ListService);
      const userId = requireIdentityId(ctx);
      return service.list({ userId, spaceId });
    },
  }),
}));
