import { useEffect } from "react";
import Box from "@mui/material/Box";
import { useRouterState, Outlet } from "@tanstack/react-router";
import { useGetCurrentUserQuery } from "@generated/api/@tanstack/react-query.gen";
import { useAuthStore } from "@features/auth";
import { redirectToOidcSignIn } from "../../../lib/auth";
import { AppLoader } from "../AppLoader";

const isPublicPath = (pathname: string) => pathname === "/callback";

export const Root = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const userQuery = useGetCurrentUserQuery();

  useEffect(() => {
    const identity = userQuery.data?.data?.identity;
    if (identity) {
      setCurrentUser({
        current: {
          userId: identity.id,
          email: identity.email,
          emailVerified: identity.emailVerified,
          displayName: identity.email,
        },
        isLoading: false,
      });
      return;
    }

    if (userQuery.isError || userQuery.isSuccess) {
      setCurrentUser({ current: null, isLoading: false });
    }
  }, [userQuery.data, userQuery.isError, userQuery.isSuccess, setCurrentUser]);

  useEffect(() => {
    if (!userQuery.isError) return;
    if (isPublicPath(pathname)) return;
    redirectToOidcSignIn();
  }, [userQuery.isError, pathname]);

  if (userQuery.isPending) {
    return (
      <Box sx={{ width: "100vw", height: "100vh" }}>
        <AppLoader />
      </Box>
    );
  }

  return <Outlet />;
};
