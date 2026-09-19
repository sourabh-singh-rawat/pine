import { useEffect } from "react";
import { Box, Container, Grid2, Toolbar, useTheme } from "@mui/material";
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
    <Box display="flex" height="100vh">
      <Navbar />
      {showSidebar ? <Sidebar /> : null}
      <Container
        sx={{
          flex: 1,
          minWidth: 0,
          overflowX: "auto",
          backgroundColor: theme.palette.background.default,
        }}
        disableGutters
      >
        <Toolbar variant="dense" disableGutters />
        <Grid2 container>
          <Grid2 size={12} sx={{ px: 2, py: 1.5 }}>
            {children}
          </Grid2>
        </Grid2>
      </Container>
    </Box>
  );
};
