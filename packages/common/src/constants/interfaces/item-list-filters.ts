import { Filters } from ".";

export interface ItemListFilters extends Filters {
  projectId?: string;
  priority?: string;
}
