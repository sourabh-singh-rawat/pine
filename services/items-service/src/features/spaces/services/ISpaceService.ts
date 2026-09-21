import type { Space } from "@/db";

export type CreateSpaceInput = {
  workspaceId: string;
  name: string;
};

export type ListSpacesInput = {
  workspaceId: string;
};

export interface ISpaceService {
  create: (input: CreateSpaceInput, identityId: string) => Promise<Space>;
  getById: (id: string, identityId: string) => Promise<Space>;
  list: (input: ListSpacesInput, identityId: string) => Promise<Space[]>;
}
