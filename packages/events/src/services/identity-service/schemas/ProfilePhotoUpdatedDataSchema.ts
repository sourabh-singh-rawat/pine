import Type from "typebox";

export const ProfilePhotoUpdatedDataSchema = Type.Object(
  {
    id: Type.String(),
    identityId: Type.String(),
    photoUrl: Type.String(),
  },
  { additionalProperties: false },
);

export type ProfilePhotoUpdatedData = Type.Static<typeof ProfilePhotoUpdatedDataSchema>;
