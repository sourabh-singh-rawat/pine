import type { ApiResponse } from "@pine/common";
import Type from "typebox";
import { IdentitySchema } from "@/features/session/schemas/IdentitySchema";

export const GetIdentityFromAccessTokenDataSchema = Type.Object(
  {
    identity: IdentitySchema,
  },
  { additionalProperties: false },
);

export type GetIdentityFromAccessTokenData = Type.Static<
  typeof GetIdentityFromAccessTokenDataSchema
>;

export const GetIdentityFromAccessTokenResponseSchema = Type.Object(
  {
    data: GetIdentityFromAccessTokenDataSchema,
  },
  { additionalProperties: false },
);

export type GetIdentityFromAccessTokenResponse = ApiResponse<GetIdentityFromAccessTokenData>;
