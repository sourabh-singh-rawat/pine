import type { HttpMethod } from "../../../constants";

export type HttpIdentity = {
  id: string;
  authMethod: "access_token" | "session";
};

export type HttpUploadedFile = {
  fieldname: string;
  filename: string;
  mimetype: string;
  encoding: string;
  toBuffer: () => Promise<Buffer>;
};

export type HttpRequest = {
  method: HttpMethod;
  url: string;
  headers: Record<string, string | undefined>;
  query: Record<string, string | string[] | undefined>;
  params: Record<string, string | undefined>;
  cookies: Record<string, string | undefined>;
  body: unknown;
  identity?: HttpIdentity;
  tenantId?: string;
  organizationId?: string;
  file: () => Promise<HttpUploadedFile | undefined>;
  isMultipart: () => boolean;
};
