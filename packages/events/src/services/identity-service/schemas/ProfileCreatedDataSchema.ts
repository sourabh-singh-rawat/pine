import Type from "typebox";

export const ProfileCreatedDataSchema = Type.Object(
  {
    id: Type.String(),
    identityId: Type.String(),
    fullName: Type.Optional(Type.String()),
    firstName: Type.Optional(Type.String()),
    middleName: Type.Optional(Type.String()),
    lastName: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export type ProfileCreatedData = Type.Static<typeof ProfileCreatedDataSchema>;
