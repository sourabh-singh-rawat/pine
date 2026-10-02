import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import type { ILogoutService } from "@/features/logout/services";
import { LogoutResponseSchema, type LogoutData } from "@/features/logout/schemas";
import { InvalidCredentialError } from "@/integrations/identity";

export const logout: HttpRoute = {
  url: "/identity/logout",
  method: "POST",
  schema: {
    tags: ["auth"],
    summary: "Logout",
    description: "Invalidate the current session and clear the session cookie",
    operationId: "logout",
    response: {
      200: LogoutResponseSchema,
    },
  },
  handler: async (request) => {
    const sessionToken = request.cookies.session;

    if (!sessionToken) {
      throw new InvalidCredentialError("No active session");
    }

    const service = container.get<ILogoutService>(TYPES.LogoutService);
    await service.logout(sessionToken);

    const response: LogoutData = {
      message: "Logged out successfully.",
    };

    return {
      ...json(response),
      clearCookies: [
        {
          name: "session",
          path: "/",
          sameSite: "lax",
          secure: true,
        },
      ],
    };
  },
};
