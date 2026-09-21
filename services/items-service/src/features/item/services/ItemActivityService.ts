import { ItemCreatedData } from "@pine/events";
import { IItemActivityService } from "./IItemActivityService";

export class ItemActivityService implements IItemActivityService {
  constructor() {}

  async logCreatedItem(_payload: ItemCreatedData) {}
}
