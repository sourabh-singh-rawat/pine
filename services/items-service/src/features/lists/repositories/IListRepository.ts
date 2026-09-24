import type { DbClient, List } from "@/db";

export type ListRepositoryOptions = { tx?: DbClient };

export type CreateListEntity = {
  id?: string;
  spaceId: string;
  name: string;
  createdById: string;
};

export type UpdateListEntity = {
  name?: string;
};

export interface IListRepository {
  save(entity: CreateListEntity, options?: ListRepositoryOptions): Promise<List>;
  update(
    id: string,
    entity: UpdateListEntity,
    options?: ListRepositoryOptions,
  ): Promise<List>;
  findById(id: string, options?: ListRepositoryOptions): Promise<List | null>;
  findBySpaceId(
    spaceId: string,
    page?: number,
    pageSize?: number,
    options?: ListRepositoryOptions,
  ): Promise<{ rows: List[]; rowCount: number }>;
}
