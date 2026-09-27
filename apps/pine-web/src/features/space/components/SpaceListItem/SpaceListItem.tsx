import KeyboardArrowRightTwoTone from "@mui/icons-material/KeyboardArrowRightTwoTone";
import MoreVert from "@mui/icons-material/MoreVert";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import WorkspacesOutlined from "@mui/icons-material/WorkspacesOutlined";
import {
  Box,
  Collapse,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useGetListsQuery } from "@generated/gql";
import { CreateListModal, ListNavItem } from "@features/lists";
import { Menu, MenuItem, MenuItemIcon, type MenuAnchorPosition } from "@pine/ui";
import { useSpaceStore } from "../../store";
import { SpaceSettingsModal } from "../SpaceSettingsModal";

type SpaceListItemProps = {
  spaceId: string;
  name: string;
  workspaceId: string;
};

export const SpaceListItem = ({ spaceId, name, workspaceId }: SpaceListItemProps) => {
  const currentSpace = useSpaceStore((s) => s.currentSpace);
  const setCurrentSpace = useSpaceStore((s) => s.setCurrentSpace);
  const selected = currentSpace?.id === spaceId;
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchorPosition | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const activeViewId = useRouterState({
    select: (s) => s.location.pathname.split("/").pop(),
  });

  const listsQuery = useGetListsQuery({ spaceId }, { enabled: expanded || Boolean(activeViewId) });

  const listRows = listsQuery.data?.getLists?.rows;
  const lists = listRows ?? [];
  const isLoading = expanded && listsQuery.isPending;

  useEffect(() => {
    if (!activeViewId || listsQuery.isPending || !listRows) {
      return;
    }
    const matchesActiveList = listRows.some((list) => list?.id === activeViewId);
    if (!matchesActiveList) {
      return;
    }
    if (!expanded) {
      setExpanded(true);
    }
    if (currentSpace?.id !== spaceId) {
      setCurrentSpace({
        id: spaceId,
        name,
        workspaceId,
      });
    }
  }, [
    activeViewId,
    currentSpace?.id,
    expanded,
    name,
    listRows,
    listsQuery.isPending,
    setCurrentSpace,
    spaceId,
    workspaceId,
  ]);

  const closeMenu = () => {
    setMenuOpen(false);
    setMenuAnchor(null);
  };

  const openSettings = () => {
    closeMenu();
    setSettingsOpen(true);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          pr: 0.5,
          "&:hover .space-list-item-actions, &:focus-within .space-list-item-actions": {
            opacity: 1,
          },
          "@media (hover: none)": {
            "& .space-list-item-actions": { opacity: 1 },
          },
        }}
      >
        <ListItemButton
          dense
          selected={selected}
          sx={{ flex: 1, minWidth: 0 }}
          onClick={() => {
            setCurrentSpace({
              id: spaceId,
              name,
              workspaceId,
            });
            setExpanded((prev) => !prev);
          }}
        >
          <ListItemIcon>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: (theme) =>
                  theme.transitions.create("transform", {
                    duration: theme.transitions.duration.shorter,
                  }),
              }}
            >
              <KeyboardArrowRightTwoTone fontSize="small" />
            </Box>
          </ListItemIcon>
          <ListItemIcon>
            <WorkspacesOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={name} primaryTypographyProps={{ noWrap: true }} />
        </ListItemButton>
        <IconButton
          className="space-list-item-actions"
          size="small"
          aria-label={`Space actions for ${name}`}
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
        <CreateListModal spaceId={spaceId} />
      </Box>
      <Menu anchorPosition={menuAnchor} open={menuOpen} onClose={closeMenu}>
        <MenuItem onClick={openSettings}>
          <MenuItemIcon>
            <TuneOutlined fontSize="small" />
          </MenuItemIcon>
          Settings
        </MenuItem>
      </Menu>
      <SpaceSettingsModal
        spaceId={spaceId}
        workspaceId={workspaceId}
        name={name}
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
        }}
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {isLoading ? (
            <ListItemButton dense disabled sx={{ pl: 4 }}>
              <ListItemText>
                <Skeleton />
              </ListItemText>
            </ListItemButton>
          ) : (
            lists
              .filter(
                (
                  list,
                ): list is typeof list & {
                  id: string;
                  name: string;
                  spaceId: string;
                } => Boolean(list?.id) && Boolean(list?.name) && Boolean(list?.spaceId),
              )
              .map((list) => (
                <ListNavItem
                  key={list.id}
                  listId={list.id}
                  name={list.name}
                  spaceId={list.spaceId}
                  nested
                />
              ))
          )}
        </List>
      </Collapse>
    </Box>
  );
};
