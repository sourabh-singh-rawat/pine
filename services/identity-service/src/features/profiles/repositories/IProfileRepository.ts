import type { DbClient, Profile } from "@/db";

export type ProfileRepositoryOptions = { tx: DbClient };

export interface IProfileRepository {
  save(
    entity: Partial<Profile> & {
      identityId: string;
      firstName: string;
    },
    options?: ProfileRepositoryOptions,
  ): Promise<Profile>;
  update(
    id: string,
    entity: Partial<
      Pick<
        Profile,
        | "firstName"
        | "middleName"
        | "lastName"
        | "gender"
        | "description"
        | "photoUrl"
        | "deletedAt"
      >
    >,
    options?: ProfileRepositoryOptions,
  ): Promise<Profile>;
  existsById(id: string): Promise<boolean>;
  softDelete(id: string, options?: ProfileRepositoryOptions): Promise<void>;
  findById(id: string): Promise<Profile | null>;
  findByIdentityId(identityId: string, options?: ProfileRepositoryOptions): Promise<Profile | null>;
}
