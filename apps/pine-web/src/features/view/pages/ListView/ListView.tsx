import { Grid2, useTheme } from "@mui/material";
import { useMemo } from "react";
import { useFindStatusesQuery, useGetListQuery } from "@generated/gql";
import { useViewParams } from "@shared";
import {
  StatusesContext,
  type StatusOption,
} from "@shared/contexts/StatusesContext";
import { ItemList, ItemListLoader } from "@features/item/components/ItemList";
import { ViewLocation, ViewSwitcher } from "../../components";

const EMPTY_STATUSES: StatusOption[] = [];

export const ListView = () => {
  const theme = useTheme();
  const { viewId: listId } = useViewParams();
  const listQuery = useGetListQuery(
    { id: listId! },
    {
      select: (data) => data.getList,
      enabled: Boolean(listId),
    },
  );
  const statusesQuery = useFindStatusesQuery(
    { input: { listId: listId! } },
    {
      select: (data) =>
        (data.findStatuses ?? []).filter(
          (status): status is { id: string; name: string } =>
            Boolean(status.id) && Boolean(status.name),
        ),
      enabled: Boolean(listId),
    },
  );

  const list = listQuery.data;
  const statuses = statusesQuery.data ?? EMPTY_STATUSES;
  const statusesContextValue = useMemo(() => ({ statuses }), [statuses]);

  const listView =
    list?.id && list.name
      ? {
          id: list.id,
          name: list.name,
        }
      : null;

  const isBootstrapping =
    Boolean(listId) && (listQuery.isPending || statusesQuery.isPending);
  const canRenderItems = Boolean(listView) && !statusesQuery.isPending;

  if (isBootstrapping && !listView) {
    return <ItemListLoader />;
  }

  return (
    <Grid2 container sx={{ scrollbarGutter: "stable" }}>
      <StatusesContext.Provider value={statusesContextValue}>
        {listView && (
          <>
            <Grid2
              size={12}
              sx={{
                px: theme.spacing(2),
                py: theme.spacing(0.75),
                borderBottom: `1px solid ${theme.palette.action.hover}`,
              }}
            >
              <ViewLocation list={listView} />
            </Grid2>
            <Grid2
              size={12}
              sx={{
                px: theme.spacing(2),
                borderBottom: `1px solid ${theme.palette.action.hover}`,
              }}
            >
              <ViewSwitcher listId={listView.id} />
            </Grid2>
            <Grid2 size={12} sx={{ p: theme.spacing(2) }}>
              {canRenderItems ? (
                <ItemList listId={listView.id} />
              ) : (
                <ItemListLoader />
              )}
            </Grid2>
          </>
        )}
      </StatusesContext.Provider>
    </Grid2>
  );
};
