import type {
  FastifyReply,
  FastifyRequest,
  RawServerBase,
  RawServerDefault,
  RouteGenericInterface,
} from "fastify";
import { StatusCodes } from "http-status-codes";
import type { ApiError } from "../api/ApiError";
import { Errors } from "../constants/errors/errors";
import { ResponseError, StandardError } from "../constants/errors";

type ErrorResponseBody = {
  data: null;
  errors: ApiError[];
};

const toApiErrors = (
  code: string,
  serialized: { errors: Array<{ message: string; field?: string }> },
): ApiError[] =>
  serialized.errors.map((error) => ({
    code,
    message: error.message,
    ...(error.field !== undefined ? { field: error.field } : {}),
  }));

export class ErrorHandlerUtil {
  static serialize(error: unknown): {
    statusCode: number;
    body: ErrorResponseBody;
  } {
    if (error instanceof ResponseError) {
      return {
        statusCode: error.statusCode,
        body: {
          data: null,
          errors: toApiErrors(error.errorCode, error.serializeError()),
        },
      };
    }

    if (error instanceof StandardError) {
      return {
        statusCode: error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR,
        body: {
          data: null,
          errors: toApiErrors(error.errorCode, error.serializeError()),
        },
      };
    }

    return {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      body: {
        data: null,
        errors: [{ code: Errors.ERR_INTERNAL_SERVER, message: "something went wrong" }],
      },
    };
  }

  static handleError<RawServer extends RawServerBase = RawServerDefault>(
    error: unknown,
    _request: FastifyRequest<RouteGenericInterface, RawServer>,
    reply: FastifyReply<RouteGenericInterface, RawServer>,
  ) {
    console.error(error);
    const { statusCode, body } = ErrorHandlerUtil.serialize(error);
    return reply.status(statusCode).send(body);
  }
}
