import type { Space } from "@/db";

export type CreateSpaceInput = {
  organizationId: string;
  name: string;
};

export type ListSpacesInput = {
  organizationId: string;
};

export type UpdateSpaceOptions = {
  id: string;
  name: string;
  identityId: string;
};

export interface ISpaceService {
  create: (input: CreateSpaceInput, identityId: string) => Promise<Space>;
  getById: (id: string, identityId: string) => Promise<Space>;
  list: (input: ListSpacesInput, identityId: string) => Promise<Space[]>;
  update: (options: UpdateSpaceOptions) => Promise<void>;
}
