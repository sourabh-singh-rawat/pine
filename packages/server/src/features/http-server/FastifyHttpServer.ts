import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import proxy from "@fastify/http-proxy";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import { ErrorHandlerUtil } from "@pine/common";
import {
  type FastifyInstance,
  type FastifyReply,
  type RawServerBase,
  type RouteGenericInterface,
} from "fastify";
import { mkdirSync, writeFileSync } from "node:fs";
import type { Http2SecureServer, Http2Server } from "node:http2";
import path from "node:path";
import type { IGraphQLServer } from "../graphql-server/IGraphQLServer";
import { FastifyHttpRequestAdapter } from "./FastifyHttpRequestAdapter";
import type { IHttpServer } from "./IHttpServer";
import { expandLoopbackOrigins } from "./utils";
import type {
  CookieOptions,
  CorsOptions,
  HttpServerOptions,
  MultipartOptions,
  OpenApiOptions,
  ProxyOptions,
} from "./schemas";
import type {
  HttpClearCookie,
  HttpResponse,
  HttpResponseCookie,
  HttpHooks,
  HttpRoute,
} from "./types";

export type Http2RawServer = Http2Server | Http2SecureServer;

export class FastifyHttpServer<
  RawServer extends RawServerBase = Http2SecureServer,
> implements IHttpServer {
  private readonly server: FastifyInstance<RawServer>;
  private readonly options: HttpServerOptions;
  private readonly requestAdapter = new FastifyHttpRequestAdapter();
  private openApiEnabled = false;
  private graphqlServer: IGraphQLServer | undefined;

  constructor(options: HttpServerOptions, server: FastifyInstance<RawServer>) {
    this.options = options;
    this.server = server;
    this.server.addContentTypeParser("*", { parseAs: "buffer" }, (_req, body, done) => {
      done(null, body);
    });
  }

  async start() {
    const {
      cors,
      cookie,
      multipart,
      openapi,
      proxy: proxyOptions,
      routes,
      graphql,
      hooks,
      config,
    } = this.options;

    if (cors) await this.registerCors(cors);
    if (cookie) await this.registerCookie(cookie);
    if (multipart) await this.registerMultipart(multipart);
    if (openapi) await this.registerOpenApi(openapi);
    if (proxyOptions) await this.registerProxy(proxyOptions);
    if (hooks) this.registerHooks(hooks);
    if (routes) this.registerRoutes(routes);
    if (graphql) await this.registerGraphql(graphql);

    this.registerErrorHandler();

    const { host, port } = config;
    await this.server.ready();
    await this.server.listen({ host, port });
  }

  async stop() {
    if (this.graphqlServer) {
      await this.graphqlServer.stop();
      this.graphqlServer = undefined;
    }

    await this.server.close();
  }

  writeOpenApi(filePath: string): void {
    const document = this.getOpenApiDocument();
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(document, null, 2));
  }

  getOpenApiDocument(): object {
    if (!this.openApiEnabled) {
      throw new Error("OpenAPI is not enabled. Pass openapi options to createHttpServer.");
    }
    return this.server.swagger({ yaml: false });
  }

  private async registerCors(options: CorsOptions) {
    const origin = options.origin;
    const resolvedOrigin = Array.isArray(origin)
      ? expandLoopbackOrigins(origin)
      : typeof origin === "string"
        ? expandLoopbackOrigins([origin])
        : origin;

    await this.server.register(cors, {
      methods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
      ...options,
      ...(resolvedOrigin !== undefined ? { origin: resolvedOrigin } : {}),
    });
  }

  private async registerCookie(options: CookieOptions) {
    const { secret, httpOnly = false, sameSite = false, secure = false, path = "/" } = options;

    await this.server.register(cookie, {
      ...(secret !== undefined && secret !== "" ? { secret } : {}),
      parseOptions: { httpOnly, sameSite, secure, path },
    });
  }

  private async registerMultipart(options: MultipartOptions | boolean) {
    if (options === true) {
      await this.server.register(multipart);
      return;
    }

    if (options === false) return false;

    await this.server.register(multipart, {
      limits: {
        ...(options.fileSize !== undefined ? { fileSize: options.fileSize } : {}),
        ...(options.files !== undefined ? { files: options.files } : {}),
        ...(options.fields !== undefined ? { fields: options.fields } : {}),
      },
    });
  }

  private async registerOpenApi(options: OpenApiOptions) {
    await this.server.register(swagger, {
      openapi: {
        openapi: "3.0.0",
        info: {
          title: options.info.title,
          version: options.info.version,
          description: options.info.description,
          license: options.info.license,
        },
        servers: options.servers,
        tags: options.tags,
        components:
          options.securitySchemes === undefined
            ? undefined
            : { securitySchemes: options.securitySchemes },
      },
    });
    this.openApiEnabled = true;
  }

  private async registerProxy(options: ProxyOptions) {
    for (const route of options.routes) {
      await this.server.register(proxy, {
        upstream: route.upstream,
        prefix: route.prefix,
        rewritePrefix: route.rewritePrefix ?? route.prefix,
        proxyPayloads: route.proxyPayloads ?? true,
        undici: route.undici ??
          options.undici ?? {
            headersTimeout: 60_000,
            bodyTimeout: 120_000,
          },
      });
    }
  }

  private async registerGraphql(graphqlServer: IGraphQLServer) {
    await graphqlServer.start();
    this.graphqlServer = graphqlServer;

    this.server.route({
      url: graphqlServer.path,
      method: ["POST", "GET"],
      schema: { hide: true },
      handler: async (request, reply) => {
        const httpRequest = this.requestAdapter.toHttpRequest(request);
        const response = await graphqlServer.handleRequest(httpRequest);
        return this.sendHttpResponse(reply, response);
      },
    });
  }

  private registerHooks(hooks: HttpHooks) {
    if (hooks.onRequest) {
      this.server.addHook("onRequest", async (request) => {
        const httpRequest = this.requestAdapter.toHttpRequest(request);

        delete request.headers["x-identity-id"];
        delete request.headers["x-identity-auth-method"];

        for (const hook of hooks.onRequest ?? []) {
          await hook(httpRequest);
        }

        if (httpRequest.identity) {
          request.headers["x-identity-id"] = httpRequest.identity.id;
          request.headers["x-identity-auth-method"] = httpRequest.identity.authMethod;
        }
      });
    }
  }

  private registerErrorHandler() {
    this.server.setErrorHandler((error, request, reply) =>
      ErrorHandlerUtil.handleError(error, request, reply),
    );
  }

  private registerRoutes(routes: HttpRoute[]) {
    for (const route of routes) {
      this.server.route({
        url: route.url,
        method: route.method,
        ...(route.schema !== undefined ? { schema: route.schema } : {}),
        handler: async (request, reply) => {
          const httpRequest = this.requestAdapter.toHttpRequest(request);

          if (route.hooks) for (const hook of route.hooks) await hook(httpRequest);

          const response = await route.handler(httpRequest);
          return this.sendHttpResponse(reply, response);
        },
      });
    }
  }

  private async sendHttpResponse(
    reply: FastifyReply<RouteGenericInterface, RawServer>,
    response: HttpResponse,
  ) {
    if (response.headers) {
      for (const [key, value] of Object.entries(response.headers)) reply.header(key, value);
    }

    if (response.cookies) {
      for (const item of response.cookies) this.setCookie(reply, item);
    }

    if (response.clearCookies) {
      for (const item of response.clearCookies) this.clearCookie(reply, item);
    }

    return reply.status(response.status).send(response.body);
  }

  private setCookie(
    reply: FastifyReply<RouteGenericInterface, RawServer>,
    item: HttpResponseCookie,
  ) {
    const { name, value, ...options } = item;
    reply.setCookie(name, value, options);
  }

  private clearCookie(
    reply: FastifyReply<RouteGenericInterface, RawServer>,
    item: HttpClearCookie,
  ) {
    const { name, ...options } = item;
    reply.clearCookie(name, options);
  }
}
