import Type from "typebox";
import { ConsentVerifierAuthorizeQuerySchema } from "@/features/authorize/schemas/ConsentVerifierAuthorizeQuerySchema";
import { InitialAuthorizeQuerySchema } from "@/features/authorize/schemas/InitialAuthorizeQuerySchema";
import { LoginVerifierAuthorizeQuerySchema } from "@/features/authorize/schemas/LoginVerifierAuthorizeQuerySchema";

export const AuthorizeQuerySchema = Type.Union([
  InitialAuthorizeQuerySchema,
  LoginVerifierAuthorizeQuerySchema,
  ConsentVerifierAuthorizeQuerySchema,
]);

export type AuthorizeQuery = Type.Static<typeof AuthorizeQuerySchema>;
