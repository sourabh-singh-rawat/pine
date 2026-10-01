export type {
  AcceptConsentInput,
  AcceptLoginInput,
  AuthorizeInput,
  ConsentChallenge,
  IOAuthFlowProvider,
  LoginChallenge,
  OAuthClientInfo,
  OAuthRedirectResult,
  RejectRequestInput,
} from "@/integrations/oauth/IOAuthFlowProvider";
export type {
  ExchangeTokenInput,
  IntrospectTokenResult,
  IOAuthTokenProvider,
  TokenResult,
} from "@/integrations/oauth/IOAuthTokenProvider";
export type {
  IOAuthClientProvider,
  RegisteredOAuthClient,
  RegisterOAuthClientInput,
} from "@/integrations/oauth/IOAuthClientProvider";
export {
  InvalidOAuthRequestError,
  OAuthErrorCodes,
  OAuthProviderUnavailableError,
  OAuthRequestNotFoundError,
  type OAuthErrorCode,
} from "@/integrations/oauth/errors";
export {
  HydraClient,
  HydraOAuthClientProvider,
  HydraOAuthFlowProvider,
  HydraOAuthTokenProvider,
} from "@/integrations/oauth/ory-hydra";
