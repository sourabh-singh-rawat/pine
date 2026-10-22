import { describe, expect, it, vi } from "vitest";

vi.mock("@/bootstrap/env", () => ({
  env: {
    API_PUBLIC_URL: "https://localhost/api",
  },
}));

import { toMeProfilePhotoUrl } from "../toMeProfilePhotoUrl";

describe("toMeProfilePhotoUrl", () => {
  it("returns null when input is null or undefined", () => {
    expect(toMeProfilePhotoUrl(null)).toBeNull();
    expect(toMeProfilePhotoUrl(undefined)).toBeNull();
  });

  it("returns full URL as is when already absolute", () => {
    expect(toMeProfilePhotoUrl("https://localhost:4001/attachments/att-1")).toBe(
      "https://localhost:4001/attachments/att-1",
    );
  });

  it("prepends API_PUBLIC_URL when relative path", () => {
    expect(toMeProfilePhotoUrl("/identity/profiles/identity-1/photo")).toBe(
      "https://localhost/api/identity/profiles/identity-1/photo",
    );
  });
});
