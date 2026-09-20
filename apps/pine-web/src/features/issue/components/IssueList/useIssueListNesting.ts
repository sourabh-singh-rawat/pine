import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FindSubIssuesDocument,
  graphQLFetcher,
  useFindSubIssuesQuery,
  type FindSubIssuesQuery,
  type FindSubIssuesQueryVariables,
} from "@generated/gql";
import { type IssueSource } from "./mapIssueRow";

const EMPTY_IDS: ReadonlySet<string> = new Set();

export const useIssueListNesting = (options: {
  enabled: boolean;
  projectDataUpdatedAt?: number;
}) => {
  const { enabled, projectDataUpdatedAt } = options;
  const queryClient = useQueryClient();
  const [childrenByParentId, setChildrenByParentId] = useState<
    Record<string, IssueSource[]>
  >({});
  const [expandedParentIds, setExpandedParentIds] =
    useState<ReadonlySet<string>>(EMPTY_IDS);
  const [expandingIssueIds, setExpandingIssueIds] =
    useState<ReadonlySet<string>>(EMPTY_IDS);

  const loadChildren = useCallback(
    async (parentIssueId: string) => {
      const variables: FindSubIssuesQueryVariables = {
        input: { parentIssueId },
      };
      const response = await queryClient.fetchQuery({
        queryKey: useFindSubIssuesQuery.getKey(variables),
        queryFn: graphQLFetcher<FindSubIssuesQuery, FindSubIssuesQueryVariables>(
          FindSubIssuesDocument,
          variables,
        ),
      });
      setChildrenByParentId((current) => ({
        ...current,
        [parentIssueId]: response.findSubIssues ?? [],
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
        parentIds.map(async (parentIssueId) => {
          const variables: FindSubIssuesQueryVariables = {
            input: { parentIssueId },
          };
          const response = await queryClient.fetchQuery({
            queryKey: useFindSubIssuesQuery.getKey(variables),
            queryFn: graphQLFetcher<FindSubIssuesQuery, FindSubIssuesQueryVariables>(
              FindSubIssuesDocument,
              variables,
            ),
          });
          return [parentIssueId, response.findSubIssues ?? []] as const;
        }),
      );
      if (cancelled) return;
      setChildrenByParentId(Object.fromEntries(nextEntries));
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, loadedParentIdsKey, projectDataUpdatedAt, queryClient]);

  const onToggleNestedIssue = useCallback(
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
    expandingIssueIds,
    onToggleNestedIssue,
  };
};
