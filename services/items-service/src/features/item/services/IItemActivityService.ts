import { ItemCreatedData } from "@pine/events";

export interface IItemActivityService {
  logCreatedItem(payload: ItemCreatedData): Promise<void>;
}
