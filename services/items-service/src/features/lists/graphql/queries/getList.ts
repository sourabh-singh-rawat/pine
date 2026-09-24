import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IListService } from "@/features/lists";
import { ListObject } from "../objects/ListObject";

builder.queryFields((t) => ({
  getList: t.field({
    type: ListObject,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, { id }, ctx) => {
      const service = container.get<IListService>(TYPES.ListService);
      const userId = requireIdentityId(ctx);
      return service.getById({ id, userId });
    },
  }),
}));
