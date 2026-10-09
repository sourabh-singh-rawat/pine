import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export type OrganizationDetailTab = "overview" | "relations" | "roles";

const isOrganizationDetailTab = (value: unknown): value is OrganizationDetailTab =>
  value === "overview" || value === "relations" || value === "roles";

export const Route = createFileRoute(
  "/_authenticated/tenants_/$tenantId_/organizations/$organizationId",
)({
  validateSearch: (search: Record<string, unknown>): { tab: OrganizationDetailTab } => ({
    tab:
      search.tab === "members"
        ? "relations"
        : isOrganizationDetailTab(search.tab)
          ? search.tab
          : "overview",
  }),
  component: lazyRouteComponent(() => import("@features/tenants/components"), "OrganizationDetail"),
});
