import FolderOutlined from "@mui/icons-material/FolderOutlined";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { createLink, useRouterState } from "@tanstack/react-router";
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
  const selected = viewId === listId;

  return (
    <ListNavItemLink
      to="/v/l/$viewId"
      params={{ viewId: listId }}
      dense
      selected={selected}
      sx={nested ? { pl: 4 } : undefined}
      onClick={() => {
        setCurrentList({
          id: listId,
          name,
          spaceId,
        });
        localStorage.setItem(
          "currentList",
          JSON.stringify({ id: listId, name, spaceId }),
        );
      }}
    >
      <ListItemIcon>
        <FolderOutlined fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={name} />
    </ListNavItemLink>
  );
};
