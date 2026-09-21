import { lexicographicSortSchema, printSchema } from "graphql";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { schema } from "@/graphql/schema";

export const writeSchemaToDist = (): void => {
  const schemaPath = path.join(process.cwd(), "dist", "schema.graphql");
  mkdirSync(path.dirname(schemaPath), { recursive: true });
  writeFileSync(schemaPath, printSchema(lexicographicSortSchema(schema)));
};
