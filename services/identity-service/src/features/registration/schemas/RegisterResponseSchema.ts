import type { ApiResponse } from "@pine/common";
import Type from "typebox";

export const RegisterDataSchema = Type.Object(
  {
    message: Type.String(),
  },
  { additionalProperties: false },
);

export type RegisterData = Type.Static<typeof RegisterDataSchema>;

export const RegisterResponseSchema = Type.Object(
  {
    data: RegisterDataSchema,
  },
  { additionalProperties: false },
);

export type RegisterResponse = ApiResponse<RegisterData>;
