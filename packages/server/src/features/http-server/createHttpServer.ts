import fastify from "fastify";
import { FastifyHttpServer } from "./FastifyHttpServer";
import type { IHttpServer } from "./IHttpServer";
import type { HttpServerOptions } from "./schemas/HttpServerOptionsSchema";

export const createHttpServer = (options: HttpServerOptions): IHttpServer => {
  const bodyLimit = options.bodyLimit !== undefined ? { bodyLimit: options.bodyLimit } : undefined;

  return new FastifyHttpServer(
    options,
    options.https
      ? fastify({
          http2: true,
          https: { ...options.https, allowHTTP1: options.https.allowHTTP1 ?? true },
          ...bodyLimit,
        })
      : fastify({ http2: true, ...bodyLimit }),
  );
};
