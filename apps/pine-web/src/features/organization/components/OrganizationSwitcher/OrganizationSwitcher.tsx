import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import Check from "@mui/icons-material/Check";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import {
  Button,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type MouseEvent } from "react";
import { useSetMyOrganizationPreferenceMutation } from "@generated/gql";
import { useSnackbar } from "@shared";
import { type CurrentOrganization, useOrganizationStore } from "../../store";

export const OrganizationSwitcher = () => {
  const organizations = useOrganizationStore((s) => s.organizations);
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization);
  const isLoading = useOrganizationStore((s) => s.isLoading);
  const setCurrentOrganization = useOrganizationStore((s) => s.setCurrentOrganization);
  const setPreferenceMutation = useSetMyOrganizationPreferenceMutation();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (isLoading) {
    return <CircularProgress size={16} />;
  }

  if (organizations.length === 0) {
    return null;
  }

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = async (organization: CurrentOrganization) => {
    if (organization.id === currentOrganization?.id) {
      handleClose();
      return;
    }

    try {
      await setPreferenceMutation.mutateAsync({ organizationId: organization.id });
      setCurrentOrganization(organization);
      await queryClient.invalidateQueries();
      handleClose();
    } catch {
      snackbar.error("Failed to switch organization");
    }
  };

  const label = currentOrganization?.name ?? "Select organization";

  return (
    <>
      <Button
        size="small"
        color="inherit"
        onClick={handleOpen}
        startIcon={<BusinessOutlined fontSize="small" />}
        endIcon={<KeyboardArrowDown fontSize="small" />}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorEl)}
        aria-label="Switch organization"
        disabled={setPreferenceMutation.isPending}
        sx={{
          textTransform: "none",
          maxWidth: 220,
          color: "text.primary",
        }}
      >
        <Typography variant="body2" noWrap fontWeight={600}>
          {label}
        </Typography>
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {organizations.map((organization) => {
          const selected = organization.id === currentOrganization?.id;
          return (
            <MenuItem
              key={organization.id}
              selected={selected}
              dense
              disabled={setPreferenceMutation.isPending}
              onClick={() => {
                void handleSelect(organization);
              }}
            >
              {selected ? (
                <ListItemIcon>
                  <Check fontSize="small" />
                </ListItemIcon>
              ) : (
                <ListItemIcon />
              )}
              <ListItemText
                primary={organization.name}
                secondary={organization.slug}
                primaryTypographyProps={{ noWrap: true }}
                secondaryTypographyProps={{ noWrap: true }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};
