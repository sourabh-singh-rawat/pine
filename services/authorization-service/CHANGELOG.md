# @pine/authorization-service

## 0.6.0

### Minor Changes

- 908358f: feat(authz): space/project/item graph + IssueCreated outbox

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

## 0.5.0

### Minor Changes

- e5726cc: feat(spaces): nest projects under spaces with required spaceId
- 198f930: refactor(platform): rename organization to workspace
- 03c9cf5: feat(spaces): add Space create and sidebar under workspace

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

- bfaca3c: feat(identity): extract profiles with name, events, and authz sync
- bee71c3: feat(platform): add identity relations page and graph
- 77b700a: feat(organization): add org switcher with nested memberships and tenant.read_list
- 8773588: feat(platform): add organization relations and authorization sync
- baef746: chore: remove inventory-service and product-service
- 1fad54f: feat(security): require mTLS between gateways and backend services

### Patch Changes

- bad0ca6: chore(authz): suppress sonar class-name lint on keto namespaces
- d01fc4c: feat(identity): implement profile photo upload flow and dev tls support
- c2b64b6: feat(platform): rename members to relations and publish relation created via outbox
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
  - @pine/security@0.1.2

## 0.3.0

### Minor Changes

- 617eacc: feat(platform): identities and graph membership relations
- b0911f8: feat(platform): members and roles for platform, tenant, and organization

### Patch Changes

- Updated dependencies [6960ceb]
- Updated dependencies [617eacc]
- Updated dependencies [b0911f8]
- Updated dependencies [1dd2bfb]
  - @pine/authorization@0.3.0
  - @pine/events@0.3.0
  - @pine/common@0.0.3
  - @pine/security@0.1.1
  - @pine/server@1.0.1

## 0.2.0

### Minor Changes

- 07bb3bc: feat(authz): keto subject-set grants, role capability checks, and local session identity ids

### Patch Changes

- 1933c6c: feat(authz): share requireCapability and InsufficientPermissionError
- Updated dependencies [07bb3bc]
- Updated dependencies [1933c6c]
  - @pine/authorization@0.2.0

## 0.1.0

### Minor Changes

- de6a3b1: feat(authz): organizations, authorization, roles, keto, and admin-web
- 2cd5736: refactor(authz): role capabilities model, drop permissions
- cafe973: feat(admin-web): manage role capabilities and add navbar

### Patch Changes

- d67c1e1: feat(authz): sync keto relationship tuples on role capability updated event
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
- Updated dependencies [179562a]
  - @pine/authorization@0.1.0
  - @pine/events@0.2.0
  - @pine/common@0.0.2
  - @pine/identity-client@0.1.0
  - @pine/server@1.0.0
  - @pine/outbox@0.1.0

## 0.0.0

### Minor Changes

- feat(authorization): scaffold authorization-service with roles table
