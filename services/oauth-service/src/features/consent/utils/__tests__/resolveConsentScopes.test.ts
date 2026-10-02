import { describe, expect, it } from "vitest";
import { resolveConsentScopes } from "@/features/consent/utils/resolveConsentScopes";

describe("resolveConsentScopes", () => {
  it("maps known scopes to titles and descriptions", () => {
    const scopes = resolveConsentScopes([
      "openid",
      "email",
      "profile",
      "offline",
      "offline_access",
    ]);

    expect(scopes).toEqual([
      {
        scope: "openid",
        title: "Verify your identity",
        description: "Confirm who you are when you sign in.",
      },
      {
        scope: "email",
        title: "View your email address",
        description: "See the email on your Pine account.",
      },
      {
        scope: "profile",
        title: "View your profile",
        description: "See your name and profile details.",
      },
      {
        scope: "offline",
        title: "Stay signed in",
        description: "Refresh your session without signing in again.",
      },
      {
        scope: "offline_access",
        title: "Stay signed in",
        description: "Refresh your session without signing in again.",
      },
    ]);
  });

  it("falls back to the raw scope name and generic description for unknown scopes", () => {
    const scopes = resolveConsentScopes(["custom:permission"]);

    expect(scopes).toEqual([
      {
        scope: "custom:permission",
        title: "custom:permission",
        description: "Additional access requested by this application.",
      },
    ]);
  });

  it("returns an empty array when requestedScopes is empty", () => {
    const scopes = resolveConsentScopes([]);

    expect(scopes).toEqual([]);
  });
});
