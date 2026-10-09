import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export type TenantDetailTab = "overview" | "relations" | "roles" | "organizations";

const isTenantDetailTab = (value: unknown): value is TenantDetailTab =>
  value === "overview" || value === "relations" || value === "roles" || value === "organizations";

export const Route = createFileRoute("/_authenticated/tenants_/$tenantId")({
  validateSearch: (search: Record<string, unknown>): { tab: TenantDetailTab } => ({
    tab:
      search.tab === "members"
        ? "relations"
        : isTenantDetailTab(search.tab)
          ? search.tab
          : "overview",
  }),
  component: lazyRouteComponent(() => import("@features/tenants/components"), "TenantDetail"),
});
