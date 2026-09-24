# @pine/identity-service

## 0.6.3

### Patch Changes

- Updated dependencies [36d1802]
  - @pine/events@1.1.0
  - @pine/authorization@0.7.0
  - @pine/common@1.1.0
  - @pine/server@1.1.4

## 0.6.2

### Patch Changes

- 9093046: refactor(identity): validate oauth routes via typebox schemas
- 506bed8: fix(identity): emit email-verified for admin creates and sync on verified only
- Updated dependencies [be87796]
- Updated dependencies [2c3a46a]
  - @pine/events@1.0.0
  - @pine/common@1.0.0
  - @pine/outbox@0.1.4
  - @pine/identity@0.3.2
  - @pine/security@0.1.3
  - @pine/server@1.1.3

## 0.6.1

### Patch Changes

- 14fb863: chore(vitest): upgrade to 5.0.0
- Updated dependencies [908358f]
- Updated dependencies [522b0cd]
- Updated dependencies [14fb863]
  - @pine/authorization@0.6.0
  - @pine/common@0.1.2
  - @pine/server@1.1.2
  - @pine/events@0.5.1
  - @pine/identity@0.3.1
  - @pine/outbox@0.1.3

## 0.6.0

### Minor Changes

- 44ebe40: feat(identity): allow creating a profile from Personal info

### Patch Changes

- 9b1b265: chore(web): rename erp-web to pine-web
- 198f930: refactor(platform): rename organization to workspace
- Updated dependencies [47e114e]
- Updated dependencies [44ebe40]
- Updated dependencies [e5726cc]
- Updated dependencies [198f930]
- Updated dependencies [03c9cf5]
  - @pine/server@1.1.1
  - @pine/common@0.1.1
  - @pine/authorization@0.5.0
  - @pine/events@0.5.0
  - @pine/identity@0.3.0
  - @pine/attachment@0.3.0

## 0.5.0

### Minor Changes

- bfaca3c: feat(identity): extract profiles with name, events, and authz sync
- 715fce7: refactor(identity): replace identity-client with HttpIdentityClient
- d01fc4c: feat(identity): implement profile photo upload flow and dev tls support
- 1fad54f: feat(security): require mTLS between gateways and backend services

### Patch Changes

- 01ba62c: feat(attachment-scanner): implement attachment scanner service and malware scanning pipeline
- f3ae7b4: feat(organization): persist default org preference and tenant/org request headers
- baef746: chore: remove inventory-service and product-service
- Updated dependencies [aa9d59e]
- Updated dependencies [01ba62c]
- Updated dependencies [3925de4]
- Updated dependencies [bfaca3c]
- Updated dependencies [715fce7]
- Updated dependencies [d01fc4c]
- Updated dependencies [f3ae7b4]
- Updated dependencies [77b700a]
- Updated dependencies [8773588]
- Updated dependencies [c2b64b6]
- Updated dependencies [baef746]
- Updated dependencies [1fad54f]
  - @pine/attachment@0.2.0
  - @pine/events@0.4.0
  - @pine/server@1.1.0
  - @pine/authorization@0.4.0
  - @pine/identity@0.2.0
  - @pine/common@0.1.0
  - @pine/outbox@0.1.2
  - @pine/security@0.1.2

## 0.4.2

### Patch Changes

- Updated dependencies [617eacc]
- Updated dependencies [b0911f8]
- Updated dependencies [1dd2bfb]
  - @pine/events@0.3.0
  - @pine/common@0.0.3
  - @pine/outbox@0.1.1
  - @pine/security@0.1.1
  - @pine/server@1.0.1

## 0.4.1

### Patch Changes

- 07bb3bc: feat(authz): keto subject-set grants, role capability checks, and local session identity ids

## 0.4.0

### Minor Changes

- de6a3b1: feat(authz): organizations, authorization, roles, keto, and admin-web
- 14a1fb5: Identity email verification and session APIs; migrate services to Drizzle with local identities tables; remove workspace multi-tenancy from issues and ERP web
- 4b72801: refactor(identity): drop local email, add profile names, register with username
- 0acc6d3: fix(identity): login returns 204/302 and OAuth redirect via response
- 7ed63fe: fix(oauth): 302 authorize redirect and require explicit DATABASE_URL env vars
- fff12b7: feat(outbox): schedule identity registration and brand create via outbox

### Patch Changes

- 5b5506b: chore(fmt): format code
- 7c958b1: feat(product): create product with default unit; publish nats now publish cloud events
- d206a7c: refactor: rename @pine/http-core to @pine/http
- 689a980: refactor: rename @pine/http to @pine/server and merge graphql-core
- Updated dependencies [de6a3b1]
- Updated dependencies [2cd5736]
- Updated dependencies [d67c1e1]
- Updated dependencies [8ae018c]
- Updated dependencies [5b5506b]
- Updated dependencies [14a1fb5]
- Updated dependencies [4b72801]
- Updated dependencies [84ae79f]
- Updated dependencies [d175229]
- Updated dependencies [fff12b7]
- Updated dependencies [04d33c3]
- Updated dependencies [7c958b1]
- Updated dependencies [d206a7c]
- Updated dependencies [689a980]
- Updated dependencies [5bd9a1a]
- Updated dependencies [179562a]
  - @pine/events@0.2.0
  - @pine/common@0.0.2
  - @pine/security@0.1.0
  - @pine/server@1.0.0
  - @pine/outbox@0.1.0

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
- d05915a: refactor: rename packages to events/http, add CloudEvents and Hydra OAuth
- 656d23b: feat(identity): add session cookies with me and logout
- c73b916: feat(identity): move registration to REST and implement Kratos login

### Patch Changes

- Updated dependencies [d05915a]
  - @pine/events@0.1.0
  - @pine/server@0.2.0
  - @pine/security@0.0.2

## 0.1.0

### Minor Changes

- 68dd71c: feat: rebuild identity on Kratos and replace gateway with api-gateway

### Patch Changes

- Updated dependencies [68dd71c]
  - @pine/common@0.0.1
  - @pine/errors@0.1.0
  - @pine/events@0.0.1
  - @pine/server@0.0.1
  - @pine/observability@0.1.0
  - @pine/orm@0.0.1
  - @pine/security@0.0.1
  - @pine/server-core@0.1.0
