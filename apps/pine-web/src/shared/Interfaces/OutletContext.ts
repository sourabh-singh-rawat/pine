import type { StatusObject } from "@generated/gql/graphql";

export interface OutletContext {
  listId?: string;
  itemId?: string;
  selectedTab?: number;
  status?: StatusObject[];
}
