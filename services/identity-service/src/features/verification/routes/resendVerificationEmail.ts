import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import type { IVerificationService } from "@/features/verification/services";
import {
  ResendVerificationEmailBodySchema,
  ResendVerificationEmailResponseSchema,
  type ResendVerificationEmailResponse,
} from "@/features/verification/schemas";

function isResendBody(body: unknown): body is { email: string } {
  return (
    body !== null && typeof body === "object" && "email" in body && typeof body.email === "string"
  );
}

export const resendVerificationEmail: HttpRoute = {
  url: "/identity/resendVerificationEmail",
  method: "POST",
  schema: {
    tags: ["auth"],
    summary: "Resend verification email",
    description:
      "Request a new email verification code. Always returns success to avoid revealing whether the email is registered.",
    operationId: "resendVerificationEmail",
    body: ResendVerificationEmailBodySchema,
    response: {
      200: ResendVerificationEmailResponseSchema,
    },
  },
  handler: async (request) => {
    if (!isResendBody(request.body)) {
      throw new Error("Invalid resend verification body");
    }

    const service = container.get<IVerificationService>(TYPES.VerificationService);

    await service.resendVerificationEmail({
      email: request.body.email,
    });

    const response: ResendVerificationEmailResponse = {
      message: "If an account exists for that email, a verification email has been sent.",
    };

    return json(response);
  },
};
