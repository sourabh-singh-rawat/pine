# @pine/platform-service

## 0.5.1

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

## 0.5.0

### Minor Changes

- 48e508c: feat(platform): provision personal workspace on user registration
- 198f930: refactor(platform): rename organization to workspace

### Patch Changes

- 9b1b265: chore(web): rename erp-web to pine-web
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

## 0.4.0

### Minor Changes

- bee71c3: feat(platform): add identity relations page and graph
- f3ae7b4: feat(organization): persist default org preference and tenant/org request headers
- 77b700a: feat(organization): add org switcher with nested memberships and tenant.read_list
- 8773588: feat(platform): add organization relations and authorization sync
- c2b64b6: feat(platform): rename members to relations and publish relation created via outbox
- 1fad54f: feat(security): require mTLS between gateways and backend services

### Patch Changes

- 715fce7: refactor(identity): replace identity-client with HttpIdentityClient
- d01fc4c: feat(identity): implement profile photo upload flow and dev tls support
- 061d3ba: refactor: prefix identity sync consumers with service names
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
  - @pine/events@0.4.0
  - @pine/server@1.1.0
  - @pine/authorization@0.4.0
  - @pine/identity@0.2.0
  - @pine/common@0.1.0
  - @pine/outbox@0.1.2
  - @pine/security@0.1.2

## 0.3.0

### Minor Changes

- 617eacc: feat(platform): identities and graph membership relations
- b0911f8: feat(platform): members and roles for platform, tenant, and organization
- 1dd2bfb: refactor(platform): platform-web, platform-service, and erp app rail
- f1cb277: feat(tenants): tenant and organization detail with create org

### Patch Changes

- 6960ceb: fix(authz): namespace tenant capabilities under platform
- Updated dependencies [6960ceb]
- Updated dependencies [617eacc]
- Updated dependencies [b0911f8]
- Updated dependencies [1dd2bfb]
  - @pine/authorization@0.3.0
  - @pine/events@0.3.0
  - @pine/common@0.0.3
  - @pine/outbox@0.1.1
  - @pine/security@0.1.1
  - @pine/server@1.0.1
  - @pine/identity-client@0.1.1

## 0.2.0

### Minor Changes

- 1ca92d7: feat(tenant): require capability checks on tenant service methods

### Patch Changes

- Updated dependencies [07bb3bc]
- Updated dependencies [1933c6c]
  - @pine/authorization@0.2.0

## 0.1.0

### Minor Changes

- de6a3b1: feat(authz): tenants, authorization, roles, keto, and admin-web

### Patch Changes

- 5b5506b: chore(fmt): format code
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
  - @pine/identity-client@0.1.0
  - @pine/security@0.1.0
  - @pine/server@1.0.0

## 0.0.0

### Minor Changes

- feat(tenant): scaffold tenant-service with tenants and memberships tables
