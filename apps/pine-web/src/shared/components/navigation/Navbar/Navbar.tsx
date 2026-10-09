import { Box, Grid2, styled, Toolbar, Typography, useTheme } from "@mui/material";
import { Link, useRouterState } from "@tanstack/react-router";
import { getActiveApp } from "../../../apps";
import { AccountSwitcher } from "../../../../features/auth/components/AccountSwitcher";
import { OrganizationSwitcher } from "../../../../features/organization/components/OrganizationSwitcher";

import MuiAppBar from "@mui/material/AppBar";

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

export const Navbar = () => {
  const theme = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeApp = getActiveApp(pathname);

  return (
    <AppBar position="static" sx={{ boxShadow: theme.shadows[0] }}>
      <Toolbar
        sx={{
          px: theme.spacing(2.5),
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
        }}
        variant="dense"
        disableGutters
      >
        <Box sx={{ width: "100%" }}>
          <Grid2 container sx={{ alignItems: "center" }} spacing={1.5}>
            <Grid2>
              <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{ color: theme.palette.primary.main, letterSpacing: 0.2 }}
                >
                  Pine
                </Typography>
              </Link>
            </Grid2>
            {activeApp ? (
              <Grid2>
                <Typography variant="body2" color="text.secondary">
                  {activeApp.label}
                </Typography>
              </Grid2>
            ) : null}
            <Grid2 size="grow" />
            <Grid2>
              <OrganizationSwitcher />
            </Grid2>
            <Grid2>
              <AccountSwitcher />
            </Grid2>
          </Grid2>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
