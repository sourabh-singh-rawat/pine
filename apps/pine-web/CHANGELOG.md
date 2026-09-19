# @pine/pine-web

## 0.7.1

### Patch Changes

- 961e77f: chore(deps): pin @graphql-codegen/cli to 7.4.1
- b4b54ab: chore(pine-web): remove unused firebase dependency
- c0fa509: chore(deps): remove deprecated @hey-api/client-axios
- Updated dependencies [522b0cd]
  - @pine/common@0.1.2

## 0.7.0

### Minor Changes

- e5726cc: feat(spaces): nest projects under spaces with required spaceId
- 9b1b265: chore(web): rename erp-web to pine-web
- 198f930: refactor(platform): rename organization to workspace
- 03c9cf5: feat(spaces): add Space create and sidebar under workspace

### Patch Changes

- f272fa5: feat(ui): add M3 foundation tokens for shape, color, type, motion
- a616564: fix(pine-web): make nested space projects clickable in sidebar
- Updated dependencies [44ebe40]
- Updated dependencies [f272fa5]
  - @pine/common@0.1.1
  - @pine/ui@0.1.1

## 0.6.0

### Minor Changes

- f3ae7b4: feat(organization): persist default org preference and tenant/org request headers
- 77b700a: feat(organization): add org switcher with nested memberships and tenant.read_list
- baef746: chore: remove inventory-service and product-service

### Patch Changes

- d01fc4c: feat(identity): implement profile photo upload flow and dev tls support
- Updated dependencies [d01fc4c]
- Updated dependencies [1fad54f]
  - @pine/common@0.1.0

## 0.5.0

### Minor Changes

- 1dd2bfb: refactor(platform): platform-web, platform-service, and erp app rail

### Patch Changes

- 617eacc: feat(platform): identities and graph membership relations
- b0911f8: feat(platform): members and roles for platform, tenant, and organization
- Updated dependencies [617eacc]
- Updated dependencies [1dd2bfb]
  - @pine/common@0.0.3

## 0.4.0

### Minor Changes

- 14a1fb5: Identity email verification and session APIs; migrate services to Drizzle with local identities tables; remove workspace multi-tenancy from issues and ERP web
- 9c0d187: feat(web): merge issues-web and inventory-web into a single erp-web app

  Product UI lives in `@pine/erp-web` (port 3001) with OIDC PKCE auth and an inventory route shell. Backend CORS and invite URLs use `ERP_WEB_URL` instead of separate issues/inventory web origins.

### Patch Changes

- de6a3b1: feat(authz): organizations, authorization, roles, keto, and admin-web
- Updated dependencies [de6a3b1]
- Updated dependencies [5b5506b]
- Updated dependencies [d175229]
- Updated dependencies [d206a7c]
  - @pine/ui@0.1.0
  - @pine/common@0.0.2

## 0.3.0

### Minor Changes

- Merge issues-web and inventory-web into a single ERP web app.
