import type { ApiResponse } from "@pine/common";
import Type from "typebox";
import { IdentitySchema } from "@/features/session/schemas/IdentitySchema";

export const GetIdentityFromSessionDataSchema = Type.Object(
  {
    identity: IdentitySchema,
  },
  { additionalProperties: false },
);

export type GetIdentityFromSessionData = Type.Static<typeof GetIdentityFromSessionDataSchema>;

export const GetIdentityFromSessionResponseSchema = Type.Object(
  {
    data: GetIdentityFromSessionDataSchema,
  },
  { additionalProperties: false },
);

export type GetIdentityFromSessionResponse = ApiResponse<GetIdentityFromSessionData>;
