import Type from "typebox";

export const JwksSchema = Type.Object(
  {
    keys: Type.Array(Type.Record(Type.String(), Type.Unknown())),
  },
  { additionalProperties: false },
);
