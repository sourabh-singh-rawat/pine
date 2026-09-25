import { useEffect, useLayoutEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import MuiBox from "@mui/material/Box";
import { useGetMyWorkspacePreferenceQuery, useGetMyWorkspacesQuery } from "@generated/gql";
import { useGetCurrentUserQuery } from "@generated/api/@tanstack/react-query.gen";
import { toAuthUserFromMeResponse, useAuthStore } from "@features/auth";
import { useWorkspaceStore } from "@features/workspace";
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
  const syncWorkspaces = useWorkspaceStore((s) => s.syncWorkspaces);

  const userQuery = useGetCurrentUserQuery();
  const workspacesQuery = useGetMyWorkspacesQuery(undefined, {
    select: (data) => data.getMyWorkspaces ?? [],
    enabled: userQuery.isSuccess,
  });
  const workspacePreferenceQuery = useGetMyWorkspacePreferenceQuery(undefined, {
    select: (data) => data.getMyWorkspacePreference ?? null,
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
    const preferenceReady = workspacePreferenceQuery.isSuccess || workspacePreferenceQuery.isError;
    if (!preferenceReady) {
      return;
    }

    const preferredWorkspaceId = workspacePreferenceQuery.isSuccess
      ? workspacePreferenceQuery.data?.workspaceId
      : null;

    if (workspacesQuery.isSuccess) {
      syncWorkspaces(workspacesQuery.data, { preferredWorkspaceId });
      return;
    }
    if (workspacesQuery.isError) {
      syncWorkspaces([], { preferredWorkspaceId });
    }
  }, [
    workspacePreferenceQuery.data,
    workspacePreferenceQuery.isError,
    workspacePreferenceQuery.isSuccess,
    workspacesQuery.data,
    workspacesQuery.isError,
    workspacesQuery.isSuccess,
    syncWorkspaces,
  ]);

  useEffect(() => {
    if (!userQuery.isError) return;
    if (isPublicPath(pathname)) return;
    redirectToOidcSignIn();
  }, [userQuery.isError, pathname]);

  const isBootstrapping =
    userQuery.isPending ||
    (userQuery.isSuccess && (workspacesQuery.isPending || workspacePreferenceQuery.isPending));

  return (
    <MuiBox width="100vw" height="100vh">
      {isBootstrapping ? <AppLoader /> : children}
    </MuiBox>
  );
}
