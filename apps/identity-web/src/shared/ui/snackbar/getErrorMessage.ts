import { isAxiosError } from "axios";

type ErrorResponsePayload = {
  data?: unknown;
  message?: string;
  errors?: Array<{ message?: string }>;
};

const isErrorResponsePayload = (data: unknown): data is ErrorResponsePayload =>
  typeof data === "object" && data !== null;

const extractPayloadMessage = (data: unknown): string | undefined => {
  if (!isErrorResponsePayload(data)) {
    return undefined;
  }

  const firstError = data.errors?.[0];
  if (typeof firstError?.message === "string" && firstError.message.length > 0) {
    return firstError.message;
  }

  if (typeof data.message === "string" && data.message.length > 0) {
    return data.message;
  }

  return undefined;
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const payloadMessage = extractPayloadMessage(error.response?.data);
    if (payloadMessage) {
      return payloadMessage;
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
