import { List, ListItem, ListItemText, Skeleton } from "@mui/material";
import { useEffect } from "react";
import { useGetSpacesQuery } from "@generated/gql";
import { useWorkspaceStore } from "@features/workspace";
import { useSpaceStore } from "../../store";
import { CreateSpaceModal } from "../CreateSpaceModal";
import { SpaceListItem } from "../SpaceListItem";

export const SpaceList = () => {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const currentSpace = useSpaceStore((s) => s.currentSpace);
  const setCurrentSpace = useSpaceStore((s) => s.setCurrentSpace);
  const workspaceId = currentWorkspace?.id;
  const spacesQuery = useGetSpacesQuery(
    { workspaceId: workspaceId ?? "" },
    { enabled: Boolean(workspaceId) },
  );

  useEffect(() => {
    if (!currentSpace) {
      return;
    }
    if (!workspaceId || currentSpace.workspaceId !== workspaceId) {
      setCurrentSpace(null);
    }
  }, [workspaceId, currentSpace, setCurrentSpace]);

  const spaces = spacesQuery.data?.getSpaces ?? [];
  const isLoading = Boolean(workspaceId) && spacesQuery.isPending;

  return (
    <List component="div" disablePadding>
      <ListItem secondaryAction={<CreateSpaceModal disabled={!workspaceId} />}>
        <ListItemText>Spaces</ListItemText>
      </ListItem>
      {!workspaceId ? (
        <ListItem dense>
          <ListItemText secondary="Select a workspace to manage spaces" />
        </ListItem>
      ) : null}
      {isLoading ? (
        <ListItem dense>
          <ListItemText>
            <Skeleton />
          </ListItemText>
        </ListItem>
      ) : (
        spaces
          .filter(
            (
              space,
            ): space is typeof space & {
              id: string;
              name: string;
              workspaceId: string;
            } => Boolean(space.id) && Boolean(space.name) && Boolean(space.workspaceId),
          )
          .map(({ id, name, workspaceId: spaceWorkspaceId }) => (
            <SpaceListItem key={id} spaceId={id} name={name} workspaceId={spaceWorkspaceId} />
          ))
      )}
    </List>
  );
};
