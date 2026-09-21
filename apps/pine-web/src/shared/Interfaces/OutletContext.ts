import type { StatusObject } from "@generated/gql/graphql";

export interface OutletContext {
  projectId?: string;
  itemId?: string;
  selectedTab?: number;
  status?: StatusObject[];
}
