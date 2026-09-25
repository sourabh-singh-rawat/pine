import { List, ListItem, ListItemText, Skeleton } from "@mui/material";
import { useGetListsQuery } from "@generated/gql";
import { CreateListModal } from "../CreateListModal";
import { ListNavItem } from "../ListNavItem";

type ListsPanelProps = {
  spaceId: string;
};

export const ListsPanel = ({ spaceId }: ListsPanelProps) => {
  const listsQuery = useGetListsQuery({ spaceId });
  const lists = listsQuery.data?.getLists?.rows ?? [];
  const isLoading = listsQuery.isPending;

  return (
    <List
      subheader={
        <>
          <ListItem secondaryAction={<CreateListModal spaceId={spaceId} />}>
            <ListItemText>Lists</ListItemText>
          </ListItem>
          {isLoading ? (
            <ListItem dense>
              <ListItemText>
                <Skeleton />
              </ListItemText>
            </ListItem>
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
                />
              ))
          )}
        </>
      }
      disablePadding
    />
  );
};
