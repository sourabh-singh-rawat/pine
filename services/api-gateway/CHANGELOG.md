# @pine/api-gateway

## 0.4.4

### Patch Changes

- Updated dependencies [36d1802]
  - @pine/common@1.1.0
  - @pine/server@1.1.4

## 0.4.3

### Patch Changes

- Updated dependencies [2c3a46a]
  - @pine/common@1.0.0
  - @pine/identity@0.3.2
  - @pine/server@1.1.3

## 0.4.2

### Patch Changes

- 5e0aff4: chore(deps): update @fastify/swagger-ui to 6.1.1
- 522b0cd: chore(deps): upgrade fastify to 5.12.4
- Updated dependencies [522b0cd]
- Updated dependencies [14fb863]
  - @pine/common@0.1.2
  - @pine/server@1.1.2
  - @pine/identity@0.3.1

## 0.4.1

### Patch Changes

- 9b1b265: chore(web): rename erp-web to pine-web
- 198f930: refactor(platform): rename organization to workspace
- Updated dependencies [47e114e]
- Updated dependencies [44ebe40]
- Updated dependencies [198f930]
  - @pine/server@1.1.1
  - @pine/common@0.1.1
  - @pine/identity@0.3.0

## 0.4.0

### Minor Changes

- baef746: chore: remove inventory-service and product-service
- 1fad54f: feat(security): require mTLS between gateways and backend services

### Patch Changes

- d01fc4c: feat(identity): implement profile photo upload flow and dev tls support
- f3ae7b4: feat(organization): persist default org preference and tenant/org request headers
- Updated dependencies [3925de4]
- Updated dependencies [715fce7]
- Updated dependencies [d01fc4c]
- Updated dependencies [f3ae7b4]
- Updated dependencies [1fad54f]
  - @pine/server@1.1.0
  - @pine/identity@0.2.0
  - @pine/common@0.1.0

## 0.3.3

### Patch Changes

- @pine/server@1.0.1

## 0.3.2

### Patch Changes

- 07bb3bc: feat(authz): keto subject-set grants, role capability checks, and local session identity ids

## 0.3.1

### Patch Changes

- 11abe4b: feat(product): add product-service with dedicated database, gateway proxy and bootstrap; add brand operations
- de6a3b1: feat(authz): organizations, authorization, roles, keto, and admin-web
- 9c0d187: feat(web): merge issues-web and inventory-web into a single erp-web app

  Product UI lives in `@pine/erp-web` (port 3001) with OIDC PKCE auth and an inventory route shell. Backend CORS and invite URLs use `ERP_WEB_URL` instead of separate issues/inventory web origins.

- d206a7c: refactor: rename @pine/http-core to @pine/http
- 689a980: refactor: rename @pine/http to @pine/server and merge graphql-core
- Updated dependencies [4b72801]
- Updated dependencies [d206a7c]
- Updated dependencies [689a980]
  - @pine/server@1.0.0

## 0.3.0

### Minor Changes

- dfa43fd: feat(inventory): add inventory-service with gateway proxy, bootstrap env modules, and OAuth token cookies
- 1ab5ff4: refactor(env): unify root .env and URL-based service bootstrap

### Patch Changes

- Updated dependencies [dfa43fd]
  - @pine/server@0.2.1

## 0.2.0

### Minor Changes

- 2f7e145: feat(identity): add OAuth consent, token exchange, and client auth flows
- bbf22bc: feat(api-gateway): add schemas:watch compose and supergraph hot-reload
- c73b916: feat(identity): move registration to REST and implement Kratos login

### Patch Changes

- Updated dependencies [d05915a]
  - @pine/server@0.2.0

## 0.1.0

### Minor Changes

- 68dd71c: feat: rebuild identity on Kratos and replace gateway with api-gateway

### Patch Changes

- Updated dependencies [68dd71c]
  - @pine/observability@0.1.0
  - @pine/server-core@0.1.0
