import type { ApiResponse } from "@pine/common";
import Type from "typebox";
import { MeIdentitySchema } from "@/features/me/schemas/MeIdentitySchema";
import { MeProfileSchema } from "@/features/me/schemas/MeProfileSchema";

export const MeDataSchema = Type.Object(
  {
    identity: MeIdentitySchema,
    profile: Type.Union([MeProfileSchema, Type.Null()]),
  },
  { additionalProperties: false },
);

export type MeData = Type.Static<typeof MeDataSchema>;

export const MeResponseSchema = Type.Object(
  {
    data: MeDataSchema,
  },
  { additionalProperties: false },
);

export type MeResponse = ApiResponse<MeData>;
