import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import { IStatusService } from "@/features/status";
import { FindStatusesOptions } from "../inputs/FindStatusesOptions";
import { StatusObject } from "../objects/StatusObject";

builder.queryFields((t) => ({
  findStatuses: t.field({
    type: [StatusObject],
    args: {
      input: t.arg({ type: FindStatusesOptions, required: true }),
    },
    resolve: async (_root, { input }) => {
      const { projectId } = input;
      const service = container.get<IStatusService>(TYPES.StatusService);
      return await service.findStatuses({ projectId });
    },
  }),
}));
