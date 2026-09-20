import {
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import Logout from "@mui/icons-material/Logout";
import { useLogoutMutation } from "@generated/api/@tanstack/react-query.gen";
import Avatar from "../../../../shared/components/Avatar";
import { clearAuthenticated, redirectToOidcSignIn } from "../../../../lib/auth";
import { redirectToIdentityWeb } from "@shared/utils/identity-web";
import { useAuthStore } from "../../store";

export const AccountSwitcher = () => {
  const theme = useTheme();
  const current = useAuthStore((s) => s.current);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const logoutMutation = useLogoutMutation();

  const handleClick = (e: React.FormEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    await logoutMutation.mutateAsync({});
    setCurrentUser({ current: null });
    clearAuthenticated();
    redirectToOidcSignIn();
  };

  const label = current?.displayName || current?.email;
  const photoUrl = current?.photoUrl ?? undefined;

  return (
    <>
      <IconButton size="small" onClick={handleClick} disableRipple>
        <Avatar label={label} photoUrl={photoUrl} isLoading={isLoading} />
      </IconButton>
      {current && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
          <MenuItem
            onClick={() => {
              handleClose();
              redirectToIdentityWeb();
            }}
            dense
          >
            <ListItemIcon>
              <Avatar label={label} photoUrl={photoUrl} />
            </ListItemIcon>
            <Stack>
              <Typography sx={{ color: theme.palette.text.primary, fontWeight: "bold" }}>
                {label}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {current.email}
              </Typography>
            </Stack>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} dense>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      )}
    </>
  );
};
