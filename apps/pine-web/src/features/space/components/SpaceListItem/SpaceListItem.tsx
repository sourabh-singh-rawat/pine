import KeyboardArrowRightTwoTone from "@mui/icons-material/KeyboardArrowRightTwoTone";
import WorkspacesOutlined from "@mui/icons-material/WorkspacesOutlined";
import {
  Box,
  Collapse,
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
import { useSpaceStore } from "../../store";

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

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", pr: 0.5 }}>
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
          <ListItemText primary={name} />
        </ListItemButton>
        <CreateListModal spaceId={spaceId} />
      </Box>
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
