---
name: identity-auth
description: >
  Identity and OAuth: Kratos/Hydra behind I*Provider, session/signin/register
  HTTP features, requireIdentityId, gateway identity. Use when changing login,
  session, OAuth consent, or IdP integrations.
when-to-use: >
  Kratos, Hydra, session, signin, OAuth consent, ISessionProvider,
  requireIdentityId, identity-web, getIdentityFromSession, x-identity-id,
  resolveRequestIdentity
---

# Identity auth

IdP stays behind interfaces. Canonical service: `identity-service`. UI: `identity-web`. Gateway: `api-gateway`. Local Ory: `docker-infra`. Related: `http-route`, `service-feature`, `authorization`.

## Recipe

| Problem | Feature folder | Provider |
| ------- | -------------- | -------- |
| Sign-in | `features/signin` | `ISessionProvider` |
| Registration | `features/registration` | `IRegistrationProvider` |
| Email verification | `features/verification` | `IVerificationProvider` |
| Session / whoami | `features/session` | `ISessionProvider` + `IOAuthTokenProvider` |
| Logout | `features/logout` | `ISessionProvider` |
| OAuth authorize/consent/token | `features/oauth` | `IOAuthFlowProvider` / `IOAuthTokenProvider` / `IOAuthClientProvider` |
| Current user | `features/me` | identity + profile services |
| Admin identities | `features/admin` | `IIdentityAdminProvider` |

Kratos: `integrations/identity/` (`KratosClient`, `Kratos*Provider`). Hydra: `integrations/oauth/` (`HydraClient`, `Hydra*Provider`). Services call `I*Provider` only. Map IdP ids → local identity ids via `IIdentityService.getIdByExternalId`.

HTTP: `http-route` (`signin`, `register`, `verifyEmail`, `getIdentityFromSession`, `getIdentityFromAccessToken`, `acceptConsent`, …). GraphQL admin: `features/admin`.

**Who resolves identity**

| Process | How |
| ------- | --- |
| `api-gateway` | `HttpIdentityClient.resolveRequestIdentity` (Bearer or `accessToken` cookie → identity-service; else Kratos `session` cookie) |
| Other services | `resolveIdentityFromHeaders` (`x-identity-id`, `x-identity-auth-method`) + `resolveTenantContextFromHeaders` (`x-tenant-id`, `x-workspace-id`) |
| Resolvers / routes | `requireIdentityId(ctx)` / `requireIdentity(request)` from `@pine/identity` |
| Call identity-service | `HttpIdentityClient` |

Do not put feature routes or domain GraphQL on `api-gateway`. It federates subgraphs, proxies `/identity`, `/attachments`, `/authorization`, and attaches identity. `data-gateway` is a separate HTTP proxy — not identity.

Cookies/session tokens stay in identity-service + identity-web. Other apps rely on the gateway.

## Anti-patterns

- Importing `@ory/kratos-client` / `@ory/hydra-client` from a feature service
- Calling Kratos from `platform-service`, `items-service`, or a web app
- Re-implementing cookie/Bearer parsing in a downstream service (use headers)
- New sign-in/OAuth logic in GraphQL when the existing feature is HTTP
- Secrets in `kratos.yaml` (root `.env` only — `docker-infra`)
- Feature handlers on `api-gateway`

## Done when

- New auth behavior lives in the matching feature + `I*Provider`
- Routes use `http-route` identifiers; clients match `operationId`
- Non-identity services only see headers / `requireIdentityId` / `HttpIdentityClient`
