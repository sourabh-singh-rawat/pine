import type { DbClient, Section } from "@/db";

export type SectionRepositoryOptions = { tx?: DbClient };

export type CreateSectionEntity = {
  tenantId: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export type UpdateSectionEntity = {
  name?: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
};

export interface ISectionRepository {
  saveSection: (
    entity: CreateSectionEntity,
    options?: SectionRepositoryOptions,
  ) => Promise<Section>;
  findSectionById: (id: string, options?: SectionRepositoryOptions) => Promise<Section | null>;
  listSectionsByOrganizationId: (
    organizationId: string,
    options?: SectionRepositoryOptions,
  ) => Promise<Section[]>;
  existsSectionBySlugInOrganization: (
    organizationId: string,
    slug: string,
    excludeId?: string,
    options?: SectionRepositoryOptions,
  ) => Promise<boolean>;
  existsSectionByNameInOrganization: (
    organizationId: string,
    name: string,
    excludeId?: string,
    options?: SectionRepositoryOptions,
  ) => Promise<boolean>;
  updateSection: (
    id: string,
    entity: UpdateSectionEntity,
    options?: SectionRepositoryOptions,
  ) => Promise<Section | null>;
  softDeleteSection: (id: string, options?: SectionRepositoryOptions) => Promise<boolean>;
}
