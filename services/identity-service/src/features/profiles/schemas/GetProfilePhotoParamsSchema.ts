import Type from "typebox";

export const GetProfilePhotoParamsSchema = Type.Object(
  {
    identityId: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export type GetProfilePhotoParams = Type.Static<typeof GetProfilePhotoParamsSchema>;
