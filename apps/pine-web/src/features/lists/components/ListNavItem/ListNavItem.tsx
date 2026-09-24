import EditOutlined from "@mui/icons-material/EditOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import MoreVert from "@mui/icons-material/MoreVert";
import {
  Box,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { createLink, useRouterState } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  useGetListQuery,
  useGetListsQuery,
  useUpdateListMutation,
} from "@generated/gql";
import {
  Menu,
  MenuItem,
  MenuItemIcon,
  type MenuAnchorPosition,
} from "@pine/ui";
import { useSnackbar } from "@shared";
import { useListStore } from "../../store";

const ListNavItemLink = createLink(ListItemButton);

type ListNavItemProps = {
  listId: string;
  name: string;
  spaceId: string;
  nested?: boolean;
};

export const ListNavItem = ({
  listId,
  name,
  spaceId,
  nested = false,
}: ListNavItemProps) => {
  const viewId = useRouterState({ select: (s) => s.location.pathname.split("/").pop() });
  const setCurrentList = useListStore((s) => s.setCurrentList);
  const currentList = useListStore((s) => s.currentList);
  const selected = viewId === listId;
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const updateListMutation = useUpdateListMutation();
  const skipBlurSaveRef = useRef(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchorPosition | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);

  const persistCurrentList = (nextName: string) => {
    const next = { id: listId, name: nextName, spaceId };
    setCurrentList(next);
    localStorage.setItem("currentList", JSON.stringify(next));
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMenuAnchor(null);
  };

  const startRename = () => {
    closeMenu();
    skipBlurSaveRef.current = false;
    setRenameValue(name);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    skipBlurSaveRef.current = true;
    setIsRenaming(false);
    setRenameValue(name);
  };

  const saveRename = async () => {
    const nextName = renameValue.trim();
    if (nextName.length === 0) {
      snackbar.error("List name is required");
      return;
    }
    if (nextName === name) {
      setIsRenaming(false);
      return;
    }

    try {
      await updateListMutation.mutateAsync({
        input: { id: listId, name: nextName },
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: useGetListsQuery.getKey({ spaceId }),
        }),
        queryClient.invalidateQueries({
          queryKey: useGetListQuery.getKey({ id: listId }),
        }),
      ]);
      if (currentList?.id === listId || selected) {
        persistCurrentList(nextName);
      }
      setIsRenaming(false);
      snackbar.success("List renamed");
    } catch (error) {
      snackbar.error(
        error instanceof Error ? error.message : "Failed to rename list",
      );
    }
  };

  if (isRenaming) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          pl: nested ? 4 : 1,
          pr: 0.5,
          py: 0.25,
        }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          <FolderOutlined fontSize="small" />
        </ListItemIcon>
        <TextField
          size="small"
          fullWidth
          autoFocus
          value={renameValue}
          disabled={updateListMutation.isPending}
          onChange={(event) => {
            setRenameValue(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void saveRename();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              cancelRename();
            }
          }}
          onBlur={() => {
            if (skipBlurSaveRef.current) {
              skipBlurSaveRef.current = false;
              return;
            }
            if (!updateListMutation.isPending) {
              void saveRename();
            }
          }}
          inputProps={{ "aria-label": "Rename list" }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        pr: 0.5,
        "&:hover .list-nav-item-actions, &:focus-within .list-nav-item-actions": {
          opacity: 1,
        },
        "@media (hover: none)": {
          "& .list-nav-item-actions": { opacity: 1 },
        },
      }}
    >
      <ListNavItemLink
        to="/v/l/$viewId"
        params={{ viewId: listId }}
        dense
        selected={selected}
        sx={{ flex: 1, minWidth: 0, ...(nested ? { pl: 4 } : {}) }}
        onClick={() => {
          persistCurrentList(name);
        }}
      >
        <ListItemIcon>
          <FolderOutlined fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={name} primaryTypographyProps={{ noWrap: true }} />
      </ListNavItemLink>
      <IconButton
        className="list-nav-item-actions"
        size="small"
        aria-label={`List actions for ${name}`}
        disabled={updateListMutation.isPending}
        sx={{
          opacity: menuOpen || selected ? 1 : 0,
          flexShrink: 0,
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const rect = event.currentTarget.getBoundingClientRect();
          setMenuAnchor({ top: rect.bottom, left: rect.left });
          setMenuOpen(true);
        }}
      >
        <MoreVert fontSize="small" />
      </IconButton>
      <Menu
        anchorPosition={menuAnchor}
        open={menuOpen}
        onClose={closeMenu}
      >
        <MenuItem onClick={startRename}>
          <MenuItemIcon>
            <EditOutlined fontSize="small" />
          </MenuItemIcon>
          Rename
        </MenuItem>
      </Menu>
    </Box>
  );
};
