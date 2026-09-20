import { builder } from "@pine/server";
import type { Issue, Project } from "@/db";
import { ProjectObject } from "@/features/project/graphql/objects/ProjectObject";

type IssueObjectShape = Issue & {
  project?: Project;
  parentIssue?: Issue | null;
  subIssues?: Issue[] | null;
};

export const IssueObject = builder.objectRef<IssueObjectShape>("IssueObject");

IssueObject.implement({
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
          throw new Error("Issue project relation not loaded");
        }
        return parent.project;
      },
    }),
    parentIssue: t.field({
      type: IssueObject,
      nullable: true,
      resolve: (parent) => parent.parentIssue ?? null,
    }),
    subIssues: t.field({
      type: [IssueObject],
      nullable: true,
      resolve: (parent) => parent.subIssues ?? null,
    }),
    estimate: t.exposeInt("estimate", { nullable: true }),
    component: t.exposeString("component", { nullable: true }),
    dueDate: t.expose("dueDate", { type: "DateTimeISO", nullable: true }),
  }),
});
