import type { ApiResponse } from "@pine/common";
import Type from "typebox";

export const SignInDataSchema = Type.Object(
  {
    identity: Type.Object(
      {
        id: Type.String({ minLength: 1 }),
        email: Type.String({ format: "email" }),
        emailVerified: Type.Optional(Type.Boolean()),
      },
      { additionalProperties: false },
    ),
    redirectTo: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

export type SignInData = Type.Static<typeof SignInDataSchema>;

export const SignInResponseSchema = Type.Object(
  {
    data: SignInDataSchema,
  },
  { additionalProperties: false },
);

export type SignInResponse = ApiResponse<SignInData>;
