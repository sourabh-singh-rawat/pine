import type { FastifyRequest, RawServerBase, RouteGenericInterface } from "fastify";
import { isHttpMethod } from "../../constants";
import type { HttpRequest, HttpUploadedFile } from "./types";

export class FastifyHttpRequestAdapter {
  private readonly httpRequests = new WeakMap<
    FastifyRequest<RouteGenericInterface, RawServerBase>,
    HttpRequest
  >();

  toHttpRequest(request: FastifyRequest<RouteGenericInterface, RawServerBase>): HttpRequest {
    const cached = this.httpRequests.get(request);
    if (cached) return cached;

    const headers: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(request.headers)) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }

    if (!isHttpMethod(request.method)) {
      throw new Error(`Unsupported HTTP method: ${request.method}`);
    }

    const httpRequest: HttpRequest = {
      method: request.method,
      url: request.url,
      headers,
      query: this.toQueryRecord(request.query),
      params: this.toParamsRecord(request.params),
      cookies: this.toCookies(request),
      get body() {
        return request.body;
      },
      isMultipart: () => {
        if (typeof request.isMultipart === "function") {
          return request.isMultipart();
        }
        const contentType = request.headers["content-type"];
        return (
          typeof contentType === "string" &&
          contentType.toLowerCase().includes("multipart/form-data")
        );
      },
      file: async (): Promise<HttpUploadedFile | undefined> => {
        if (typeof request.file !== "function") return undefined;
        if (typeof request.isMultipart === "function" && !request.isMultipart()) return undefined;

        const data = await request.file();
        if (!data) return undefined;

        return {
          fieldname: data.fieldname,
          filename: data.filename,
          mimetype: data.mimetype,
          encoding: data.encoding,
          toBuffer: () => data.toBuffer(),
        };
      },
    };

    this.httpRequests.set(request, httpRequest);
    return httpRequest;
  }

  private toCookies(
    request: FastifyRequest<RouteGenericInterface, RawServerBase>,
  ): Record<string, string | undefined> {
    const cookies = request.cookies;
    if (cookies === null || typeof cookies !== "object") {
      return {};
    }

    const result: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(cookies)) {
      if (value === undefined || typeof value === "string") result[key] = value;
    }
    return result;
  }

  private toQueryRecord(value: unknown): Record<string, string | string[] | undefined> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    const result: Record<string, string | string[] | undefined> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined || typeof entry === "string") {
        result[key] = entry;
        continue;
      }
      if (Array.isArray(entry) && entry.every((item) => typeof item === "string")) {
        result[key] = entry;
      }
    }
    return result;
  }

  private toParamsRecord(value: unknown): Record<string, string | undefined> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    const result: Record<string, string | undefined> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined || typeof entry === "string") result[key] = entry;
    }

    return result;
  }
}
