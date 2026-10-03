import { useEffect } from "react";
import { Box, Container, Grid2, useTheme } from "@mui/material";
import { useRouterState } from "@tanstack/react-router";
import { useAuthStore } from "@features/auth";
import { appShowsSidebar, getActiveApp } from "../../apps";
import { redirectToOidcSignIn } from "../../../lib/auth";
import { AppLoader } from "../AppLoader";
import { Navbar } from "../navigation/Navbar";
import { Sidebar } from "../navigation/Sidebar";

interface PrivateRoutesProps {
  children?: React.ReactNode;
}

export const PrivateRoutes = ({ children }: PrivateRoutesProps) => {
  const current = useAuthStore((s) => s.current);
  const isLoading = useAuthStore((s) => s.isLoading);
  const theme = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeApp = getActiveApp(pathname);
  const showSidebar = appShowsSidebar(activeApp);

  useEffect(() => {
    if (!isLoading && !current) {
      redirectToOidcSignIn();
    }
  }, [isLoading, current]);

  if (isLoading || !current) return <AppLoader />;

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Navbar />
      <Box display="flex" flex={1} minHeight={0}>
        {showSidebar ? <Sidebar /> : null}
        <Container
          maxWidth={false}
          sx={{
            flex: 1,
            minWidth: 0,
            overflowX: "auto",
            backgroundColor: theme.palette.background.default,
          }}
          disableGutters
        >
          <Grid2 container>
            <Grid2 size={12} sx={{ px: 2, py: 1.5 }}>
              {children}
            </Grid2>
          </Grid2>
        </Container>
      </Box>
    </Box>
  );
};
