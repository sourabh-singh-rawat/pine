import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import type { ISignInService } from "@/features/signin/services";
import {
  SignInBodySchema,
  SignInQuerySchema,
  SignInResponseSchema,
  type SignInData,
} from "@/features/signin/schemas";
const readQueryString = (
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined => {
  const value = query[key];
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
};

const isSignInBody = (body: unknown): body is { email: string; password: string } => {
  return (
    body !== null &&
    typeof body === "object" &&
    "email" in body &&
    typeof body.email === "string" &&
    "password" in body &&
    typeof body.password === "string"
  );
};

export const signin: HttpRoute = {
  url: "/identity/signin",
  method: "POST",
  schema: {
    tags: ["auth"],
    summary: "Sign in with email and password",
    description:
      "Authenticate a user with email and password via the identity provider. Sets the session cookie. When a login_challenge is present, returns redirectTo for the OAuth provider.",
    operationId: "signInWithEmailAndPassword",
    body: SignInBodySchema,
    querystring: SignInQuerySchema,
    response: {
      200: SignInResponseSchema,
    },
  },
  handler: async (request) => {
    if (!isSignInBody(request.body)) {
      throw new Error("Invalid sign-in body");
    }

    const service = container.get<ISignInService>(TYPES.SignInService);
    const result = await service.signInWithEmailAndPassword({
      email: request.body.email,
      password: request.body.password,
      loginChallenge: readQueryString(request.query, "login_challenge"),
    });

    const response: SignInData = {
      identity: {
        id: result.identity.id,
        email: result.identity.email,
        emailVerified: result.identity.emailVerified,
      },
      ...(result.redirectTo ? { redirectTo: result.redirectTo } : {}),
    };

    return {
      ...json(response),
      cookies: [
        {
          name: "session",
          value: result.sessionToken,
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure: true,
          expires: result.expiresAt,
        },
      ],
    };
  },
};
