# @pine/authorization

## 0.6.0

### Minor Changes

- 908358f: feat(authz): space/project/item graph + IssueCreated outbox

## 0.5.0

### Minor Changes

- e5726cc: feat(spaces): nest projects under spaces with required spaceId
- 198f930: refactor(platform): rename organization to workspace
- 03c9cf5: feat(spaces): add Space create and sidebar under workspace

## 0.4.0

### Minor Changes

- bfaca3c: feat(identity): extract profiles with name, events, and authz sync
- 77b700a: feat(organization): add org switcher with nested memberships and tenant.read_list
- 8773588: feat(platform): add organization relations and authorization sync
- baef746: chore: remove inventory-service and product-service

### Patch Changes

- d01fc4c: feat(identity): implement profile photo upload flow and dev tls support

## 0.3.0

### Minor Changes

- 617eacc: feat(platform): identities and graph membership relations
- b0911f8: feat(platform): members and roles for platform, tenant, and organization

### Patch Changes

- 6960ceb: fix(authz): namespace tenant capabilities under platform

## 0.2.0

### Minor Changes

- 07bb3bc: feat(authz): keto subject-set grants, role capability checks, and local session identity ids
- 1933c6c: feat(authz): share requireCapability and InsufficientPermissionError

## 0.1.0

### Minor Changes

- de6a3b1: feat(authz): organizations, authorization, roles, keto, and admin-web
- 2cd5736: refactor(authz): role capabilities model, drop permissions

### Patch Changes

- 5b5506b: chore(fmt): format code

## 0.0.0

### Patch Changes

- Initial package with shared permission definitions
