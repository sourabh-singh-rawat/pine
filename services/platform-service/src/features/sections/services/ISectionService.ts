import type { Section } from "@/db";

export type CreateSectionInput = {
  tenantId: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export type UpdateSectionInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
};

export interface ISectionService {
  createSection: (input: CreateSectionInput, actorId: string) => Promise<Section>;
  getSectionById: (id: string, actorId: string) => Promise<Section>;
  listSections: (organizationId: string, actorId: string) => Promise<Section[]>;
  updateSection: (id: string, input: UpdateSectionInput, actorId: string) => Promise<Section>;
  deleteSection: (id: string, actorId: string) => Promise<void>;
}
