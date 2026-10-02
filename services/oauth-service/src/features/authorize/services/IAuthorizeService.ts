import type {
  ForwardAuthorizationResult,
  OAuthSetCookie,
} from "@/integrations/oauth/IOAuthFlowProvider";

export interface AuthorizeOptions {
  search: string;
  cookieHeader?: string;
}

export type AuthorizeResult = ForwardAuthorizationResult;

export type { OAuthSetCookie };

export interface IAuthorizeService {
  authorize(params: AuthorizeOptions): Promise<AuthorizeResult>;
}
