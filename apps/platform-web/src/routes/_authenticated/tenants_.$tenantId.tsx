import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export type TenantDetailTab = "overview" | "relations" | "organizations" | "organization-types";

const isTenantDetailTab = (value: unknown): value is TenantDetailTab =>
  value === "overview" ||
  value === "relations" ||
  value === "organizations" ||
  value === "organization-types";

export const Route = createFileRoute("/_authenticated/tenants_/$tenantId")({
  validateSearch: (search: Record<string, unknown>): { tab: TenantDetailTab } => ({
    tab:
      search.tab === "members" || search.tab === "roles"
        ? "relations"
        : search.tab === "office-types"
          ? "organization-types"
          : isTenantDetailTab(search.tab)
            ? search.tab
            : "overview",
  }),
  component: lazyRouteComponent(() => import("@features/tenants/components"), "TenantDetail"),
});
