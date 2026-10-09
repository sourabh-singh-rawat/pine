import { useEffect, useLayoutEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import MuiBox from "@mui/material/Box";
import { useGetMyOrganizationPreferenceQuery, useGetMyOrganizationsQuery } from "@generated/gql";
import { useGetCurrentUserQuery } from "@generated/api/@tanstack/react-query.gen";
import { toAuthUserFromMeResponse, useAuthStore } from "@features/auth";
import { useOrganizationStore } from "@features/organization";
import { redirectToOidcSignIn } from "../../../lib/auth";
import { AppLoader } from "../AppLoader";

interface MainProps {
  children?: React.ReactNode;
}

const isPublicPath = (pathname: string) =>
  pathname === "/email-verification" || pathname === "/callback";

export function Main({ children }: MainProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const syncOrganizations = useOrganizationStore((s) => s.syncOrganizations);

  const userQuery = useGetCurrentUserQuery();
  const organizationsQuery = useGetMyOrganizationsQuery(undefined, {
    select: (data) => data.getMyOrganizations ?? [],
    enabled: userQuery.isSuccess,
  });
  const organizationPreferenceQuery = useGetMyOrganizationPreferenceQuery(undefined, {
    select: (data) => data.getMyOrganizationPreference ?? null,
    enabled: userQuery.isSuccess,
  });

  useEffect(() => {
    const current = toAuthUserFromMeResponse(userQuery.data);
    if (current) {
      setCurrentUser({
        current,
        isLoading: false,
      });
      return;
    }

    if (userQuery.isError || userQuery.isSuccess) {
      setCurrentUser({ current: null, isLoading: false });
    }
  }, [userQuery.data, userQuery.isError, userQuery.isSuccess, setCurrentUser]);

  useLayoutEffect(() => {
    const preferenceReady =
      organizationPreferenceQuery.isSuccess || organizationPreferenceQuery.isError;
    if (!preferenceReady) {
      return;
    }

    const preferredOrganizationId = organizationPreferenceQuery.isSuccess
      ? organizationPreferenceQuery.data?.organizationId
      : null;

    if (organizationsQuery.isSuccess) {
      syncOrganizations(organizationsQuery.data, { preferredOrganizationId });
      return;
    }
    if (organizationsQuery.isError) {
      syncOrganizations([], { preferredOrganizationId });
    }
  }, [
    organizationPreferenceQuery.data,
    organizationPreferenceQuery.isError,
    organizationPreferenceQuery.isSuccess,
    organizationsQuery.data,
    organizationsQuery.isError,
    organizationsQuery.isSuccess,
    syncOrganizations,
  ]);

  useEffect(() => {
    if (!userQuery.isError) return;
    if (isPublicPath(pathname)) return;
    redirectToOidcSignIn();
  }, [userQuery.isError, pathname]);

  const isBootstrapping =
    userQuery.isPending ||
    (userQuery.isSuccess &&
      (organizationsQuery.isPending || organizationPreferenceQuery.isPending));

  return (
    <MuiBox width="100vw" height="100vh">
      {isBootstrapping ? <AppLoader /> : children}
    </MuiBox>
  );
}
