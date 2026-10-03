import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  GetListItemsDocument,
  graphQLFetcher,
  useGetListItemsQuery,
  type GetListItemsQuery,
  type GetListItemsQueryVariables,
} from "@generated/gql";

export const useItemListLoadMore = (listId: string | undefined) => {
  const queryClient = useQueryClient();
  const [loadingStatusId, setLoadingStatusId] = useState<string | null>(null);

  const onLoadMore = useCallback(
    async (statusId: string, after: string) => {
      if (!listId) {
        return;
      }

      setLoadingStatusId(statusId);
      try {
        const variables: GetListItemsQueryVariables = { listId, statusId, after };
        const page = await queryClient.fetchQuery({
          queryKey: useGetListItemsQuery.getKey(variables),
          queryFn: graphQLFetcher<GetListItemsQuery, GetListItemsQueryVariables>(
            GetListItemsDocument,
            variables,
          ),
        });

        const pageGroup = page.getListItems?.[0];
        if (!pageGroup?.status?.id) {
          return;
        }

        queryClient.setQueryData<GetListItemsQuery>(
          useGetListItemsQuery.getKey({ listId }),
          (current) => {
            if (!current?.getListItems) {
              return current;
            }

            return {
              getListItems: current.getListItems.map((group) => {
                if (group?.status?.id !== pageGroup.status?.id) {
                  return group;
                }

                const existingIds = new Set(
                  (group.items ?? []).flatMap((item) => (item?.id ? [item.id] : [])),
                );
                const appended = (pageGroup.items ?? []).filter(
                  (item) => item?.id && !existingIds.has(item.id),
                );

                return {
                  ...group,
                  items: [...(group.items ?? []), ...appended],
                  pageInfo: pageGroup.pageInfo,
                  totalCount: pageGroup.totalCount ?? group.totalCount,
                };
              }),
            };
          },
        );
      } finally {
        setLoadingStatusId(null);
      }
    },
    [listId, queryClient],
  );

  return { onLoadMore, loadingStatusId };
};
