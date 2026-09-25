import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/tenants")({
  component: lazyRouteComponent(() => import("@features/tenants/components"), "Tenants"),
});
