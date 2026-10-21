import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Section } from "@/db";
import { OrganizationNotFoundError } from "@/features/organizations/errors";
import type { IOrganizationRepository } from "@/features/organizations/repositories";
import { SectionConflictError, SectionNotFoundError } from "@/features/sections/errors";
import type { ISectionRepository } from "@/features/sections/repositories/ISectionRepository";
import type {
  CreateSectionInput,
  ISectionService,
  UpdateSectionInput,
} from "@/features/sections/services/ISectionService";

@injectable()
export class SectionService implements ISectionService {
  constructor(
    @inject(TYPES.SectionRepository)
    private readonly sectionRepository: ISectionRepository,
    @inject(TYPES.OrganizationRepository)
    private readonly organizationRepository: IOrganizationRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async createSection(input: CreateSectionInput, actorId: string): Promise<Section> {
    await requirePermission(
      this.authorizationClient,
      actorId,
      "manage_sections",
      `Organization:${input.organizationId}`,
    );

    const organization = await this.organizationRepository.findById(input.organizationId);
    if (!organization || organization.tenantId !== input.tenantId) {
      throw new OrganizationNotFoundError(`Organization not found: ${input.organizationId}`);
    }

    if (
      await this.sectionRepository.existsSectionBySlugInOrganization(
        input.organizationId,
        input.slug,
      )
    ) {
      throw new SectionConflictError(`Section slug already exists in organization: ${input.slug}`);
    }

    if (
      await this.sectionRepository.existsSectionByNameInOrganization(
        input.organizationId,
        input.name,
      )
    ) {
      throw new SectionConflictError(`Section name already exists in organization: ${input.name}`);
    }

    return this.sectionRepository.saveSection({
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      isActive: input.isActive,
    });
  }

  async getSectionById(id: string, actorId: string): Promise<Section> {
    const section = await this.sectionRepository.findSectionById(id);
    if (!section) {
      throw new SectionNotFoundError(`Section not found: ${id}`);
    }

    await requirePermission(
      this.authorizationClient,
      actorId,
      "read",
      `Organization:${section.organizationId}`,
    );

    return section;
  }

  async listSections(organizationId: string, actorId: string): Promise<Section[]> {
    await requirePermission(
      this.authorizationClient,
      actorId,
      "read",
      `Organization:${organizationId}`,
    );

    return this.sectionRepository.listSectionsByOrganizationId(organizationId);
  }

  async updateSection(id: string, input: UpdateSectionInput, actorId: string): Promise<Section> {
    const section = await this.sectionRepository.findSectionById(id);
    if (!section) {
      throw new SectionNotFoundError(`Section not found: ${id}`);
    }

    await requirePermission(
      this.authorizationClient,
      actorId,
      "manage_sections",
      `Organization:${section.organizationId}`,
    );

    if (input.slug !== undefined) {
      if (
        await this.sectionRepository.existsSectionBySlugInOrganization(
          section.organizationId,
          input.slug,
          id,
        )
      ) {
        throw new SectionConflictError(
          `Section slug already exists in organization: ${input.slug}`,
        );
      }
    }

    if (input.name !== undefined) {
      if (
        await this.sectionRepository.existsSectionByNameInOrganization(
          section.organizationId,
          input.name,
          id,
        )
      ) {
        throw new SectionConflictError(
          `Section name already exists in organization: ${input.name}`,
        );
      }
    }

    const updated = await this.sectionRepository.updateSection(id, {
      name: input.name,
      slug: input.slug,
      description: input.description,
      isActive: input.isActive,
    });
    if (!updated) {
      throw new SectionNotFoundError(`Section not found: ${id}`);
    }

    return updated;
  }

  async deleteSection(id: string, actorId: string): Promise<void> {
    const section = await this.sectionRepository.findSectionById(id);
    if (!section) {
      throw new SectionNotFoundError(`Section not found: ${id}`);
    }

    await requirePermission(
      this.authorizationClient,
      actorId,
      "manage_sections",
      `Organization:${section.organizationId}`,
    );

    await this.sectionRepository.softDeleteSection(id);
  }
}
