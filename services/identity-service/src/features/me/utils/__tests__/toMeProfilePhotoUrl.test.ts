import { describe, expect, it, vi } from "vitest";

vi.mock("@/bootstrap/env", () => ({
  env: {
    DATA_GATEWAY_URL: "https://localhost:4001",
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

  it("prepends DATA_GATEWAY_URL when relative path", () => {
    expect(toMeProfilePhotoUrl("/attachments/att-1")).toBe(
      "https://localhost:4001/attachments/att-1",
    );
  });
});
