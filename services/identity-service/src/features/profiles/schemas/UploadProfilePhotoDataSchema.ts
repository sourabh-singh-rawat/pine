import Type from "typebox";

export const UploadProfilePhotoDataSchema = Type.Object(
  {
    photoUrl: Type.String(),
  },
  { additionalProperties: false },
);

export type UploadProfilePhotoData = Type.Static<typeof UploadProfilePhotoDataSchema>;
