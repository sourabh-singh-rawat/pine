export const HttpMethod = {
  DELETE: "DELETE",
  GET: "GET",
  PATCH: "PATCH",
  POST: "POST",
  PUT: "PUT",
  OPTIONS: "OPTIONS",
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

const httpMethods = new Set<string>(Object.values(HttpMethod));

export const isHttpMethod = (method: string): method is HttpMethod => httpMethods.has(method);
