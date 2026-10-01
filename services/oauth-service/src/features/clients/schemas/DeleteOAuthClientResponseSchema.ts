import Type from "typebox";

export const DeleteOAuthClientResponseSchema = Type.Object({
  deleted: Type.Boolean(),
});

export type DeleteOAuthClientResponse = Type.Static<typeof DeleteOAuthClientResponseSchema>;
