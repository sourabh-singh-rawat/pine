import Type from "typebox";
import { UploadProfilePhotoDataSchema } from "@/features/profiles/schemas/UploadProfilePhotoDataSchema";

export const UploadProfilePhotoResponseSchema = Type.Object(
  {
    data: UploadProfilePhotoDataSchema,
  },
  { additionalProperties: false },
);

export type UploadProfilePhotoResponse = Type.Static<typeof UploadProfilePhotoResponseSchema>;
