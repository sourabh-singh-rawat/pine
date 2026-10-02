import type { ApiResponse } from "@pine/common";
import Type from "typebox";

export const LogoutDataSchema = Type.Object(
  {
    message: Type.String(),
  },
  { additionalProperties: false },
);

export type LogoutData = Type.Static<typeof LogoutDataSchema>;

export const LogoutResponseSchema = Type.Object(
  {
    data: LogoutDataSchema,
  },
  { additionalProperties: false },
);

export type LogoutResponse = ApiResponse<LogoutData>;
