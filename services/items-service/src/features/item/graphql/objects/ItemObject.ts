import { requireIdentityId } from "@pine/identity";
import { builder } from "@pine/server";
import { TYPES, container } from "@/bootstrap";
import type { Item, List } from "@/db";
import {
  ChecklistObject,
  toChecklistObjectShape,
  type ChecklistObjectShape,
} from "@/features/checklists/graphql/objects/ChecklistObject";
import type { ChecklistSummary } from "@/features/checklists/repositories";
import type { IChecklistService } from "@/features/checklists/services";
import { ListObject } from "@/features/lists/graphql/objects/ListObject";

type ItemObjectShape = Item & {
  list?: List;
  parentItem?: Item | null;
  subItems?: Item[] | null;
  hasChildren?: boolean;
  checklists?: ChecklistSummary[];
};

const toChecklistSummaryObjectShape = (summary: ChecklistSummary): ChecklistObjectShape => ({
  id: summary.id,
  itemId: summary.itemId,
  name: summary.name,
  createdById: summary.createdById,
  createdAt: summary.createdAt,
  completedCount: summary.completedCount,
  totalCount: summary.totalCount,
  entries: [],
});

export const ItemObject = builder.objectRef<ItemObjectShape>("ItemObject");

ItemObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    statusId: t.exposeString("statusId"),
    priority: t.exposeString("priority"),
    list: t.field({
      type: ListObject,
      resolve: (parent) => {
        if (!parent.list) {
          throw new Error("Item list relation not loaded");
        }
        return parent.list;
      },
    }),
    parentItem: t.field({
      type: ItemObject,
      nullable: true,
      resolve: (parent) => parent.parentItem ?? null,
    }),
    subItems: t.field({
      type: [ItemObject],
      nullable: true,
      resolve: (parent) => parent.subItems ?? null,
    }),
    hasChildren: t.boolean({
      resolve: (parent) => parent.hasChildren ?? false,
    }),
    checklists: t.field({
      type: [ChecklistObject],
      resolve: async (parent, _args, ctx) => {
        if (parent.checklists !== undefined) {
          return parent.checklists.map(toChecklistSummaryObjectShape);
        }
        const service = container.get<IChecklistService>(TYPES.ChecklistService);
        const rows = await service.list({
          itemId: parent.id,
          identityId: requireIdentityId(ctx),
        });
        return rows.map(toChecklistObjectShape);
      },
    }),
    estimate: t.exposeInt("estimate", { nullable: true }),
    component: t.exposeString("component", { nullable: true }),
    dueDate: t.expose("dueDate", { type: "DateTimeISO", nullable: true }),
  }),
});
