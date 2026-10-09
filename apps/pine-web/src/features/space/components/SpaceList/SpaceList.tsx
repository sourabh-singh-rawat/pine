import { List, ListItem, ListItemText, Skeleton } from "@mui/material";
import { useEffect } from "react";
import { useGetSpacesQuery } from "@generated/gql";
import { useOrganizationStore } from "@features/organization";
import { useSpaceStore } from "../../store";
import { CreateSpaceModal } from "../CreateSpaceModal";
import { SpaceListItem } from "../SpaceListItem";

export const SpaceList = () => {
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization);
  const currentSpace = useSpaceStore((s) => s.currentSpace);
  const setCurrentSpace = useSpaceStore((s) => s.setCurrentSpace);
  const organizationId = currentOrganization?.id;
  const spacesQuery = useGetSpacesQuery(
    { organizationId: organizationId ?? "" },
    { enabled: Boolean(organizationId) },
  );

  useEffect(() => {
    if (!currentSpace) {
      return;
    }
    if (!organizationId || currentSpace.organizationId !== organizationId) {
      setCurrentSpace(null);
    }
  }, [organizationId, currentSpace, setCurrentSpace]);

  const spaces = spacesQuery.data?.getSpaces ?? [];
  const isLoading = Boolean(organizationId) && spacesQuery.isPending;

  return (
    <List component="div" disablePadding>
      <ListItem secondaryAction={<CreateSpaceModal disabled={!organizationId} />}>
        <ListItemText>Spaces</ListItemText>
      </ListItem>
      {!organizationId ? (
        <ListItem dense>
          <ListItemText secondary="Select a organization to manage spaces" />
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
              organizationId: string;
            } => Boolean(space.id) && Boolean(space.name) && Boolean(space.organizationId),
          )
          .map(({ id, name, organizationId: spaceOrganizationId }) => (
            <SpaceListItem key={id} spaceId={id} name={name} organizationId={spaceOrganizationId} />
          ))
      )}
    </List>
  );
};
