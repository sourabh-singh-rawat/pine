import { builder } from "@pine/server";

export const UpdateItemInput = builder.inputType("UpdateItemInput", {
  fields: (t) => ({
    itemId: t.string({ required: true }),
    name: t.string({ required: false }),
    type: t.string({ required: false }),
    statusId: t.string({ required: false }),
    priority: t.string({ required: false }),
    dueDate: t.field({ type: "DateTimeISO", required: false }),
    description: t.string({ required: false }),
    estimate: t.int({ required: false }),
    component: t.string({ required: false }),
  }),
});
