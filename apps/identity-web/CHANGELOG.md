# @pine/identity-web

## 0.6.2

### Patch Changes

- Updated dependencies [c29925a]
- Updated dependencies [595f7f5]
- Updated dependencies [a4ffbd4]
  - @pine/ui@0.2.0

## 0.6.1

### Patch Changes

- 961e77f: chore(deps): pin @graphql-codegen/cli to 7.4.1
- c0fa509: chore(deps): remove deprecated @hey-api/client-axios

## 0.6.0

### Minor Changes

- 44ebe40: feat(identity): allow creating a profile from Personal info
- e1f5abf: feat(identity-web): show email and verification status on Personal info

## 0.5.0

### Minor Changes

- 3925de4: feat(attachment): add attachment service upload target, proxy, and outbox event integration
- bfaca3c: feat(identity): extract profiles with name, events, and authz sync
- 35cec8a: feat(identity-web): add navbar and gender to personal info

### Patch Changes

- 01ba62c: feat(attachment-scanner): implement attachment scanner service and malware scanning pipeline
- d01fc4c: feat(identity): implement profile photo upload flow and dev tls support

## 0.4.0

### Minor Changes

- 14a1fb5: Identity email verification and session APIs; migrate services to Drizzle with local identities tables; remove workspace multi-tenancy from issues and ERP web
- 4b72801: refactor(identity): drop local email, add profile names, register with username

### Patch Changes

- de6a3b1: feat(authz): organizations, authorization, roles, keto, and admin-web
- 0acc6d3: fix(identity): login returns 204/302 and OAuth redirect via response

## 0.3.0

### Minor Changes

- 1ab5ff4: refactor(env): unify root .env and URL-based service bootstrap

## 0.2.0

### Minor Changes

- 2f7e145: feat(identity): add OAuth consent, token exchange, and client auth flows
- 656d23b: feat(identity): add session cookies with me and logout
- c73b916: feat(identity): move registration to REST and implement Kratos login

## 0.1.0

### Minor Changes

- 68dd71c: feat: rebuild identity on Kratos and replace gateway with api-gateway
