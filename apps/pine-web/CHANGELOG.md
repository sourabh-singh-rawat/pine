# @pine/pine-web

## 0.9.2

### Patch Changes

- 7402a71: refactor(pine-web): move item attachments to attachments feature
- 7c6bfe1: feat(pine-web): edit checklist item description via double click or edit button
- 2af2b5c: refactor(pine-web): extract item-checklists and rename item-attachments
- 0568fbd: refactor(pine-web): extract item-sub-items feature

## 0.9.1

### Patch Changes

- cb64c16: feat(pine-web): attachment drag-drop upload and show more
- ca70154: feat(pine-web): grid attachment previews with image lightbox
- 606145b: feat(pine-web): PDF attachment icon and lightbox preview

## 0.9.0

### Minor Changes

- 36d1802: refactor: rename Project domain to List

### Patch Changes

- 6977338: feat(items): add item checklists API and detail UI
- e9b15c5: feat(lists): rename lists from the sidebar menu
- Updated dependencies [36d1802]
  - @pine/common@1.1.0

## 0.8.0

### Minor Changes

- 9a92efe: feat(issue-list): edit due date from list with Calendar
- 2c3a46a: feat(items): rename issue domain to item across service, events, and web

### Patch Changes

- 5f02f5a: feat(auth): share OIDC browser sign-in helpers across web apps
- 9ee99da: feat(auth): share PKCE helpers via @pine/auth
- 17a7a3d: feat(audit): show create activity on issue detail
- 20b381a: feat(issues): show nested children in project issue list
- 93a9ef9: feat(ui): add Menu and MenuItem components
- e163b5b: feat(items): upload and link attachments on item detail
- 39e7d6c: feat(pine-web): show identity profile photo in AccountSwitcher
- 3856e45: feat(pine-web): issue list leading status icon menu
- 097dbd4: feat(pine-web): edit issue name from list view
- dc56251: feat(pine-web): redirect profile to identity-web
- 15ea4dd: feat(ui): stabilize IssueList menu, grouping, and wavy loader
- Updated dependencies [5f02f5a]
- Updated dependencies [9ee99da]
- Updated dependencies [9a92efe]
- Updated dependencies [20b381a]
- Updated dependencies [cda60a6]
- Updated dependencies [93a9ef9]
- Updated dependencies [8cfee8b]
- Updated dependencies [1b8f27b]
- Updated dependencies [e44b19d]
- Updated dependencies [2c3a46a]
- Updated dependencies [15ea4dd]
  - @pine/auth@0.2.0
  - @pine/ui@0.3.0
  - @pine/common@1.0.0

## 0.7.2

### Patch Changes

- c29925a: feat(ui): add AppBar with editable issue title on issue page
- 6b83fce: feat(issues): soft-delete with project delete authz
- a5fe0e9: feat(pine-web): edit issue priority from list view
- c645562: refactor(pine-web): remove unused AppRail
- 595f7f5: feat(ui): TanStack Table v9 DataTable with status-grouped issue list
- Updated dependencies [c29925a]
- Updated dependencies [595f7f5]
- Updated dependencies [a4ffbd4]
  - @pine/ui@0.2.0

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
