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
import { useSetMyWorkspacePreferenceMutation } from "@generated/gql";
import { useSnackbar } from "@shared";
import { type CurrentWorkspace, useWorkspaceStore } from "../../store";

export const WorkspaceSwitcher = () => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const isLoading = useWorkspaceStore((s) => s.isLoading);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const setPreferenceMutation = useSetMyWorkspacePreferenceMutation();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (isLoading) {
    return <CircularProgress size={16} />;
  }

  if (workspaces.length === 0) {
    return null;
  }

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = async (workspace: CurrentWorkspace) => {
    if (workspace.id === currentWorkspace?.id) {
      handleClose();
      return;
    }

    try {
      await setPreferenceMutation.mutateAsync({ workspaceId: workspace.id });
      setCurrentWorkspace(workspace);
      await queryClient.invalidateQueries();
      handleClose();
    } catch {
      snackbar.error("Failed to switch workspace");
    }
  };

  const label = currentWorkspace?.name ?? "Select workspace";

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
        aria-label="Switch workspace"
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
        {workspaces.map((workspace) => {
          const selected = workspace.id === currentWorkspace?.id;
          return (
            <MenuItem
              key={workspace.id}
              selected={selected}
              dense
              disabled={setPreferenceMutation.isPending}
              onClick={() => {
                void handleSelect(workspace);
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
                primary={workspace.name}
                secondary={workspace.slug}
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
