import { ListStatus } from "../enums/list-status";

export class ListFormData {
  constructor(
    public name: string,
    public description: string,
    public status: ListStatus,
    public startDate: Date,
    public endDate: Date,
  ) {}
}
