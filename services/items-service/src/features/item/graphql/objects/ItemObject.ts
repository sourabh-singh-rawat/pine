import { builder } from "@pine/server";
import type { Item, Project } from "@/db";
import { ProjectObject } from "@/features/project/graphql/objects/ProjectObject";

type ItemObjectShape = Item & {
  project?: Project;
  parentItem?: Item | null;
  subItems?: Item[] | null;
  hasChildren?: boolean;
};

export const ItemObject = builder.objectRef<ItemObjectShape>("ItemObject");

ItemObject.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    statusId: t.exposeString("statusId"),
    priority: t.exposeString("priority"),
    project: t.field({
      type: ProjectObject,
      resolve: (parent) => {
        if (!parent.project) {
          throw new Error("Item project relation not loaded");
        }
        return parent.project;
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
    estimate: t.exposeInt("estimate", { nullable: true }),
    component: t.exposeString("component", { nullable: true }),
    dueDate: t.expose("dueDate", { type: "DateTimeISO", nullable: true }),
  }),
});
