import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
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
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async list(options: ListOptions) {
    const { userId, parentItemId } = options;

    const parentItem = await this.itemRepository.findById(parentItemId);
    if (!parentItem) {
      throw new ItemNotFoundError("Parent not found");
    }

    await requirePermission(this.authorizationClient, userId, "read", `list:${parentItem.listId}`);

    return this.itemRepository.findChildren(parentItemId);
  }
}
