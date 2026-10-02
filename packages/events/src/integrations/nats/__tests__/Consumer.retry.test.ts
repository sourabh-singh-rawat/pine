import { ErrorCode, NatsError } from "nats";
import { describe, expect, it } from "vitest";
import { formatConsumerError, isRetryableConsumerStartError } from "../Consumer";

describe("isRetryableConsumerStartError", () => {
  it("returns true for NatsError TIMEOUT", () => {
    const error = NatsError.errorForCode(ErrorCode.Timeout);
    expect(isRetryableConsumerStartError(error)).toBe(true);
  });

  it("returns false for non-timeout NatsError", () => {
    const error = NatsError.errorForCode(ErrorCode.NoResponders);
    expect(isRetryableConsumerStartError(error)).toBe(false);
  });

  it("returns false for generic Error", () => {
    expect(isRetryableConsumerStartError(new Error("boom"))).toBe(false);
  });
});

describe("formatConsumerError", () => {
  it("formats NatsError with code", () => {
    const error = NatsError.errorForCode(ErrorCode.Timeout);
    expect(formatConsumerError(error)).toBe("TIMEOUT: TIMEOUT");
  });

  it("formats Error message", () => {
    expect(formatConsumerError(new Error("boom"))).toBe("boom");
  });
});
