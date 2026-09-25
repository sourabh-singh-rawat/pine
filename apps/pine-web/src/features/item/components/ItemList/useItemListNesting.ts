import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GetSubItemsDocument,
  graphQLFetcher,
  useGetSubItemsQuery,
  type GetSubItemsQuery,
  type GetSubItemsQueryVariables,
} from "@generated/gql";
import { type ItemSource } from "./mapItemRow";

const EMPTY_IDS: ReadonlySet<string> = new Set();

export const useItemListNesting = (options: { enabled: boolean; listDataUpdatedAt?: number }) => {
  const { enabled, listDataUpdatedAt } = options;
  const queryClient = useQueryClient();
  const [childrenByParentId, setChildrenByParentId] = useState<Record<string, ItemSource[]>>({});
  const [expandedParentIds, setExpandedParentIds] = useState<ReadonlySet<string>>(EMPTY_IDS);
  const [expandingItemIds, setExpandingIssueIds] = useState<ReadonlySet<string>>(EMPTY_IDS);

  const loadChildren = useCallback(
    async (parentItemId: string) => {
      const variables: GetSubItemsQueryVariables = {
        input: { parentItemId },
      };
      const response = await queryClient.fetchQuery({
        queryKey: useGetSubItemsQuery.getKey(variables),
        queryFn: graphQLFetcher<GetSubItemsQuery, GetSubItemsQueryVariables>(
          GetSubItemsDocument,
          variables,
        ),
      });
      setChildrenByParentId((current) => ({
        ...current,
        [parentItemId]: response.getSubItems ?? [],
      }));
    },
    [queryClient],
  );

  const loadedParentIdsKey = useMemo(
    () => Object.keys(childrenByParentId).sort().join(","),
    [childrenByParentId],
  );

  useEffect(() => {
    if (!enabled || !loadedParentIdsKey) return;
    const parentIds = loadedParentIdsKey.split(",");

    let cancelled = false;
    void (async () => {
      const nextEntries = await Promise.all(
        parentIds.map(async (parentItemId) => {
          const variables: GetSubItemsQueryVariables = {
            input: { parentItemId },
          };
          const response = await queryClient.fetchQuery({
            queryKey: useGetSubItemsQuery.getKey(variables),
            queryFn: graphQLFetcher<GetSubItemsQuery, GetSubItemsQueryVariables>(
              GetSubItemsDocument,
              variables,
            ),
          });
          return [parentItemId, response.getSubItems ?? []] as const;
        }),
      );
      if (cancelled) return;
      setChildrenByParentId(Object.fromEntries(nextEntries));
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, loadedParentIdsKey, listDataUpdatedAt, queryClient]);

  const onToggleNestedItem = useCallback(
    (id: string) => {
      if (expandedParentIds.has(id)) {
        setExpandedParentIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        return;
      }

      if (Object.prototype.hasOwnProperty.call(childrenByParentId, id)) {
        setExpandedParentIds((current) => {
          const next = new Set(current);
          next.add(id);
          return next;
        });
        return;
      }

      setExpandingIssueIds((current) => {
        const next = new Set(current);
        next.add(id);
        return next;
      });
      void loadChildren(id)
        .then(() => {
          setExpandedParentIds((current) => {
            const next = new Set(current);
            next.add(id);
            return next;
          });
        })
        .catch(() => undefined)
        .finally(() => {
          setExpandingIssueIds((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
        });
    },
    [childrenByParentId, expandedParentIds, loadChildren],
  );

  return {
    childrenByParentId,
    expandedParentIds,
    expandingItemIds,
    onToggleNestedItem,
  };
};
