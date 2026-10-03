import type { ApiResponse } from "@pine/common";
import Type from "typebox";

export const ResendVerificationEmailDataSchema = Type.Object(
  {
    message: Type.String(),
  },
  { additionalProperties: false },
);

export type ResendVerificationEmailData = Type.Static<typeof ResendVerificationEmailDataSchema>;

export const ResendVerificationEmailResponseSchema = Type.Object(
  {
    data: ResendVerificationEmailDataSchema,
  },
  { additionalProperties: false },
);

export type ResendVerificationEmailResponse = ApiResponse<ResendVerificationEmailData>;
