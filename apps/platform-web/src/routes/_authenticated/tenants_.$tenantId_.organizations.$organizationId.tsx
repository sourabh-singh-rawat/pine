import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export type OrganizationDetailTab = "overview" | "members" | "sections";

const isOrganizationDetailTab = (value: unknown): value is OrganizationDetailTab =>
  value === "overview" || value === "members" || value === "sections";

export const Route = createFileRoute(
  "/_authenticated/tenants_/$tenantId_/organizations/$organizationId",
)({
  validateSearch: (search: Record<string, unknown>): { tab: OrganizationDetailTab } => ({
    tab:
      search.tab === "relations" || search.tab === "roles"
        ? "members"
        : isOrganizationDetailTab(search.tab)
          ? search.tab
          : "overview",
  }),
  component: lazyRouteComponent(() => import("@features/tenants/components"), "OrganizationDetail"),
});
