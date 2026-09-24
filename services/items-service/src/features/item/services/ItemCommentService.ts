import { ServiceResponse } from "@pine/common";
import { IItemCommentService } from "./IItemCommentService";

export class ItemCommentService implements IItemCommentService {
  constructor() {}

  async create(_userId: string, _itemId: string, _description: string) {}

  async list(_itemId: string) {
    return new ServiceResponse({ rows: [], filteredRowCount: 1 });
  }

  async delete(_commentId: string) {}
}
