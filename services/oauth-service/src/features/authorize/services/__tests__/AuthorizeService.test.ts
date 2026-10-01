import { describe, expect, it, vi } from "vitest";
import { AuthorizeService } from "@/features/authorize/services/AuthorizeService";
import type { IOAuthFlowProvider } from "@/integrations/oauth";
import { InvalidOAuthRequestError } from "@/integrations/oauth/errors";

const createFlowProvider = (overrides: Partial<IOAuthFlowProvider> = {}): IOAuthFlowProvider => ({
  forwardAuthorization: vi.fn(),
  getLoginRequest: vi.fn(),
  acceptLoginRequest: vi.fn(),
  rejectLoginRequest: vi.fn(),
  getConsentRequest: vi.fn(),
  acceptConsentRequest: vi.fn(),
  rejectConsentRequest: vi.fn(),
  ...overrides,
});

describe("AuthorizeService.authorize", () => {
  it("forwards the authorize search and cookie header to the OAuth flow provider", async () => {
    const forwardAuthorization = vi.fn().mockResolvedValue({
      status: 302,
      location: "https://localhost:3000/signin?login_challenge=abc",
      cookies: [],
    });
    const service = new AuthorizeService(createFlowProvider({ forwardAuthorization }));

    await expect(
      service.authorize({
        search: "?client_id=pine-web&response_type=code",
        cookieHeader: "session=1",
      }),
    ).resolves.toEqual({
      status: 302,
      location: "https://localhost:3000/signin?login_challenge=abc",
      cookies: [],
    });

    expect(forwardAuthorization).toHaveBeenCalledWith({
      search: "?client_id=pine-web&response_type=code",
      cookieHeader: "session=1",
    });
  });

  it("propagates provider errors during authorize", async () => {
    const forwardAuthorization = vi.fn().mockRejectedValue(new InvalidOAuthRequestError());
    const service = new AuthorizeService(createFlowProvider({ forwardAuthorization }));

    await expect(
      service.authorize({
        search: "?client_id=pine-web",
      }),
    ).rejects.toBeInstanceOf(InvalidOAuthRequestError);
  });
});
