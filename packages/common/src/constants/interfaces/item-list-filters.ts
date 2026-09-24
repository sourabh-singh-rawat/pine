import { Filters } from ".";

export interface ItemListFilters extends Filters {
  listId?: string;
  priority?: string;
}
