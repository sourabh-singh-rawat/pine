import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database, Tag } from "@/db";
import type { IItemTagRepository, ITagRepository } from "@/features/tags/repositories";
import type {
  CreateTagOptions,
  ITagService,
  ListTagsOptions,
  UpdateTagOptions,
} from "./ITagService";

@injectable()
export class TagService implements ITagService {
  constructor(
    @inject(TYPES.TagRepository)
    private readonly tagRepository: ITagRepository,
    @inject(TYPES.ItemTagRepository)
    private readonly itemTagRepository: IItemTagRepository,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async list(options: ListTagsOptions): Promise<Tag[]> {
    return this.tagRepository.findMany({
      workspaceId: options.workspaceId,
      spaceId: options.spaceId,
    });
  }

  async getById(id: string): Promise<Tag | null> {
    return this.tagRepository.findById(id);
  }

  async create(options: CreateTagOptions): Promise<Tag> {
    return this.tagRepository.save({
      workspaceId: options.workspaceId,
      spaceId: options.spaceId,
      name: options.name.trim(),
      color: options.color,
      description: options.description,
    });
  }

  async update(options: UpdateTagOptions): Promise<Tag> {
    return this.tagRepository.update(options.id, {
      name: options.name?.trim(),
      color: options.color,
      description: options.description,
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.tagRepository.softDelete(id);
  }

  async getItemTags(itemId: string): Promise<Tag[]> {
    return this.itemTagRepository.findByItemId(itemId);
  }

  async setItemTags(itemId: string, tagIds: string[]): Promise<Tag[]> {
    return this.db.transaction(async (tx) => {
      await this.itemTagRepository.deleteByItemId(itemId, { tx });

      if (tagIds.length > 0) {
        await this.itemTagRepository.saveMany(
          tagIds.map((tagId) => ({ itemId, tagId })),
          { tx },
        );
      }

      return this.itemTagRepository.findByItemId(itemId, { tx });
    });
  }
}
