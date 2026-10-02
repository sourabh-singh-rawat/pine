import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import type { IRegistrationService } from "@/features/registration/services";
import {
  RegisterBodySchema,
  RegisterResponseSchema,
  type RegisterData,
} from "@/features/registration/schemas";

const isRegisterBody = (
  body: unknown,
): body is { email: string; username: string; password: string } => {
  return (
    body !== null &&
    typeof body === "object" &&
    "email" in body &&
    typeof body.email === "string" &&
    "username" in body &&
    typeof body.username === "string" &&
    "password" in body &&
    typeof body.password === "string"
  );
};

export const register: HttpRoute = {
  url: "/identity/register",
  method: "POST",
  schema: {
    tags: ["auth"],
    summary: "Register",
    description: "Register a new user with email and password via the identity provider",
    operationId: "register",
    body: RegisterBodySchema,
    response: {
      200: RegisterResponseSchema,
    },
  },
  handler: async (request) => {
    if (!isRegisterBody(request.body)) {
      throw new Error("Invalid register body");
    }

    const service = container.get<IRegistrationService>(TYPES.RegistrationService);

    await service.register(request.body.email, request.body.username, request.body.password);

    const response: RegisterData = {
      message: "Your request has been received.",
    };

    return json(response);
  },
};
