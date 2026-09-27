import Type from "typebox";

export const IdentityEmailVerifiedDataSchema = Type.Object(
  {
    emailVerificationStatus: Type.Union([
      Type.Literal("Unverified"),
      Type.Literal("Verified"),
      Type.Literal("Failed"),
    ]),
    userId: Type.String(),
    displayName: Type.Optional(Type.String()),
    fullName: Type.Optional(Type.String()),
    firstName: Type.Optional(Type.String()),
    middleName: Type.Optional(Type.String()),
    lastName: Type.Optional(Type.String()),
    photoUrl: Type.Optional(Type.String()),
    inviteToken: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export type IdentityEmailVerifiedData = Type.Static<typeof IdentityEmailVerifiedDataSchema>;
