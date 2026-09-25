import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export type WorkspaceDetailTab = "overview" | "relations" | "roles";

const isWorkspaceDetailTab = (value: unknown): value is WorkspaceDetailTab =>
  value === "overview" || value === "relations" || value === "roles";

export const Route = createFileRoute("/_authenticated/tenants_/$tenantId_/workspaces/$workspaceId")(
  {
    validateSearch: (search: Record<string, unknown>): { tab: WorkspaceDetailTab } => ({
      tab:
        search.tab === "members"
          ? "relations"
          : isWorkspaceDetailTab(search.tab)
            ? search.tab
            : "overview",
    }),
    component: lazyRouteComponent(() => import("@features/tenants/components"), "WorkspaceDetail"),
  },
);
