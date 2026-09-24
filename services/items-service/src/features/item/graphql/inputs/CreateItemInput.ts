import { builder } from "@pine/server";

export const CreateItemInput = builder.inputType("CreateItemInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    type: t.string({ required: true }),
    listId: t.string({ required: true }),
    parentItemId: t.string({ required: false }),
    statusId: t.id({ required: true }),
    priority: t.string({ required: true }),
    dueDate: t.field({ type: "DateTimeISO", required: false }),
    description: t.string({ required: false }),
    assigneeIds: t.stringList({ required: true }),
    estimate: t.int({ required: false }),
    component: t.string({ required: false }),
  }),
});
