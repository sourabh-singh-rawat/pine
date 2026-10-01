import Type from "typebox";

export const IntrospectTokenBodySchema = Type.Object({
  token: Type.String({ minLength: 1 }),
  scope: Type.Optional(Type.String({ minLength: 1 })),
});

export type IntrospectTokenBody = Type.Static<typeof IntrospectTokenBodySchema>;
