import Type from "typebox";

const DeleteOAuthClientDataSchema = Type.Object({
  deleted: Type.Boolean(),
});

export const DeleteOAuthClientResponseSchema = Type.Object(
  {
    data: DeleteOAuthClientDataSchema,
  },
  { additionalProperties: false },
);

export type DeleteOAuthClientResponse = Type.Static<typeof DeleteOAuthClientDataSchema>;
