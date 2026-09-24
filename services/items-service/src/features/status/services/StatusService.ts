import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { IStatusRepository } from "@/features/status/repositories";
import type { CreateOptionsOptions, FindStatusesOptions, IStatusService } from "./IStatusService";

@injectable()
export class StatusService implements IStatusService {
  constructor(
    @inject(TYPES.StatusRepository)
    private readonly statusRepository: IStatusRepository,
  ) {}

  async createOptions(options: CreateOptionsOptions) {
    const { statuses, listId, tx } = options;

    await this.statusRepository.saveMany(
      statuses.map((status) => ({
        name: status.name,
        type: status.type,
        orderIndex: status.orderIndex,
        listId,
      })),
      tx ? { tx } : undefined,
    );
  }

  async findStatuses(options: FindStatusesOptions) {
    return this.statusRepository.findByListId(options.listId);
  }
}
