import { GraphQLSchema } from "graphql";
import { builder } from "@pine/server";

import "@/features/audit/graphql";

const withoutEmptyMutation = (schema: GraphQLSchema): GraphQLSchema => {
  const mutationType = schema.getMutationType();
  if (!mutationType || Object.keys(mutationType.getFields()).length > 0) {
    return schema;
  }

  const queryType = schema.getQueryType();
  if (!queryType) {
    return schema;
  }

  return new GraphQLSchema({
    query: queryType,
    types: Object.values(schema.getTypeMap()).filter(
      (type) => type !== mutationType && !type.name.startsWith("__"),
    ),
    directives: [...schema.getDirectives()],
  });
};

export const schema = withoutEmptyMutation(builder.toSchema({}));
