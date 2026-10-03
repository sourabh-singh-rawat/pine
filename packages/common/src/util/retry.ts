export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, waitMs: number) => void;
};

const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EPIPE",
  "EAI_AGAIN",
]);

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export const isRetryableNetworkError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const code = error.code;
  return typeof code === "string" && RETRYABLE_NETWORK_CODES.has(code);
};

export const retry = async <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  const maxAttempts = options.maxAttempts ?? 8;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let attempt = 1;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (!shouldRetry(error, attempt) || attempt >= maxAttempts) {
        throw error;
      }

      const waitMs = baseDelayMs * 2 ** (attempt - 1);
      options.onRetry?.(error, attempt, waitMs);
      await delay(waitMs);
      attempt += 1;
    }
  }
};
