import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import type { IVerificationService } from "@/features/verification/services";
import {
  VerifyEmailQuerySchema,
  VerifyEmailResponseSchema,
  type VerifyEmailData,
} from "@/features/verification/schemas";

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

export const verifyEmail: HttpRoute = {
  url: "/identity/verifyEmail",
  method: "GET",
  schema: {
    tags: ["auth"],
    summary: "Verify email with Kratos code",
    description:
      "Complete email verification using the one-time code from the Kratos verification email",
    operationId: "verifyEmail",
    querystring: VerifyEmailQuerySchema,
    response: {
      200: VerifyEmailResponseSchema,
    },
  },
  handler: async (request) => {
    const flowId = readQueryString(request.query, "flow");
    const code = readQueryString(request.query, "code");
    if (flowId === undefined || code === undefined) {
      throw new Error("Missing verification query parameters");
    }

    const service = container.get<IVerificationService>(TYPES.VerificationService);

    await service.verifyEmail({ flowId, code });

    const response: VerifyEmailData = {
      message: "Email verified successfully.",
    };

    return json(response);
  },
};
