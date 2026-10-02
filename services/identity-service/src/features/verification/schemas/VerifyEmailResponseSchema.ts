import type { ApiResponse } from "@pine/common";
import Type from "typebox";

export const VerifyEmailDataSchema = Type.Object(
  {
    message: Type.String(),
  },
  { additionalProperties: false },
);

export type VerifyEmailData = Type.Static<typeof VerifyEmailDataSchema>;

export const VerifyEmailResponseSchema = Type.Object(
  {
    data: VerifyEmailDataSchema,
  },
  { additionalProperties: false },
);

export type VerifyEmailResponse = ApiResponse<VerifyEmailData>;
