import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { ItemNotFoundError } from "@/features/item/errors";
import type { IItemRepository } from "@/features/item/repositories";
import type { ISubItemService, ListOptions } from "./ISubItemService";

@injectable()
export class SubItemService implements ISubItemService {
  constructor(
    @inject(TYPES.ItemRepository)
    private readonly itemRepository: IItemRepository,
  ) {}

  async list(options: ListOptions) {
    const { userId, parentItemId } = options;

    const parentItem = await this.itemRepository.findById(parentItemId);
    if (!parentItem || parentItem.createdById !== userId) {
      throw new ItemNotFoundError("Parent not found");
    }

    return this.itemRepository.findChildren(parentItemId, userId);
  }
}
