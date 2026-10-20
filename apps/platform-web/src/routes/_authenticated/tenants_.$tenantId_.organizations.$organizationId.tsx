import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export type OrganizationDetailTab = "overview" | "relations";

const isOrganizationDetailTab = (value: unknown): value is OrganizationDetailTab =>
  value === "overview" || value === "relations";

export const Route = createFileRoute(
  "/_authenticated/tenants_/$tenantId_/organizations/$organizationId",
)({
  validateSearch: (search: Record<string, unknown>): { tab: OrganizationDetailTab } => ({
    tab:
      search.tab === "members" || search.tab === "roles"
        ? "relations"
        : isOrganizationDetailTab(search.tab)
          ? search.tab
          : "overview",
  }),
  component: lazyRouteComponent(() => import("@features/tenants/components"), "OrganizationDetail"),
});
