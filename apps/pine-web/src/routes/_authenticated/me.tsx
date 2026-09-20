import { createFileRoute } from "@tanstack/react-router";
import { redirectToIdentityWeb } from "@shared/utils/identity-web";

export const Route = createFileRoute("/_authenticated/me")({
  beforeLoad: () => {
    redirectToIdentityWeb();
  },
  component: () => null,
});
