import Type from "typebox";
import type { IGraphQLServer } from "../../graphql-server/IGraphQLServer";
import type { HttpHooks } from "../types/HttpHooks";
import type { HttpRoute } from "../types/HttpRoute";
import { CookieOptionsSchema } from "./CookieOptionsSchema";
import { CorsOptionsSchema } from "./CorsOptionsSchema";
import { HttpConfigOptionsSchema } from "./HttpConfigOptionsSchema";
import { HttpsOptionsSchema } from "./HttpsOptionsSchema";
import { MultipartOptionsSchema } from "./MultipartOptionsSchema";
import { OpenApiOptionsSchema } from "./OpenApiOptionsSchema";
import { ProxyOptionsSchema } from "./ProxyOptionsSchema";

export const HttpServerOptionsSchema = Type.Object(
  {
    config: HttpConfigOptionsSchema,
    https: HttpsOptionsSchema,
    cors: Type.Optional(CorsOptionsSchema),
    cookie: Type.Optional(CookieOptionsSchema),
    openapi: Type.Optional(OpenApiOptionsSchema),
    multipart: Type.Optional(Type.Union([MultipartOptionsSchema, Type.Boolean()])),
    bodyLimit: Type.Optional(Type.Integer({ minimum: 1 })),
    graphql: Type.Optional(Type.Unsafe<IGraphQLServer>(Type.Unknown())),
    routes: Type.Optional(Type.Unsafe<HttpRoute[]>(Type.Array(Type.Unknown()))),
    hooks: Type.Optional(Type.Unsafe<HttpHooks>(Type.Unknown())),
    proxy: Type.Optional(ProxyOptionsSchema),
  },
  { additionalProperties: false },
);

export type HttpServerOptions = Type.Static<typeof HttpServerOptionsSchema>;
