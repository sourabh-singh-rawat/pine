export type {
  AcceptConsentInput,
  AcceptLoginInput,
  AuthorizeInput,
  ConsentChallenge,
  ForwardAuthorizationInput,
  ForwardAuthorizationResult,
  IOAuthFlowProvider,
  LoginChallenge,
  OAuthClientInfo,
  OAuthRedirectResult,
  OAuthSetCookie,
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
export type {
  IOAuthDiscoveryProvider,
  JsonWebKeySet,
  OpenIdConfiguration,
} from "@/integrations/oauth/IOAuthDiscoveryProvider";
export {
  InvalidOAuthRequestError,
  OAuthErrorCodes,
  OAuthProviderUnavailableError,
  OAuthRequestExpiredError,
  OAuthRequestNotFoundError,
  type OAuthErrorCode,
} from "@/integrations/oauth/errors";
export {
  HydraClient,
  HydraOAuthClientProvider,
  HydraOAuthDiscoveryProvider,
  HydraOAuthFlowProvider,
  HydraOAuthTokenProvider,
} from "@/integrations/oauth/ory-hydra";
