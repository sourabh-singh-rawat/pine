# Changelog

## v2026.09.25.3

### Patch

- 7402a719: refactor(pine-web): move item attachments to attachments feature — Sourabh Singh Rawat (`@pine/pine-web`)
- 7c6bfe1c: feat(pine-web): edit checklist item description via double click or edit button — Sourabh Singh Rawat (`@pine/pine-web`)
- 2af2b5c9: refactor(pine-web): extract item-checklists and rename item-attachments — Sourabh Singh Rawat (`@pine/pine-web`)
- 0568fbde: refactor(pine-web): extract item-sub-items feature — Sourabh Singh Rawat (`@pine/pine-web`)

### Packages

- `@pine/pine-web@0.9.2`

## v2026.09.25.2

### Patch

- cb64c160: feat(pine-web): attachment drag-drop upload and show more — Sourabh Singh Rawat (`@pine/pine-web`)
- ca70154b: feat(pine-web): grid attachment previews with image lightbox — Sourabh Singh Rawat (`@pine/pine-web`)
- 606145b3: feat(pine-web): PDF attachment icon and lightbox preview — Sourabh Singh Rawat (`@pine/pine-web`)

### Packages

- `@pine/api-gateway@0.4.4`
- `@pine/audit-service@0.1.1`
- `@pine/authorization@0.7.0`
- `@pine/authorization-service@0.7.0`
- `@pine/common@1.1.0`
- `@pine/data-gateway@0.1.4`
- `@pine/events@1.1.0`
- `@pine/identity-service@0.6.3`
- `@pine/identity-web@0.6.4`
- `@pine/items-service@1.1.0`
- `@pine/pine-web@0.9.1`
- `@pine/platform-service@0.5.3`
- `@pine/platform-web@0.5.4`
- `@pine/server@1.1.4`

## v2026.09.25.1

### Minor

- 69773387: feat(items): add item checklists API and detail UI — Sourabh Singh Rawat (`@pine/items-service`, `@pine/pine-web`)
- e9b15c5a: feat(lists): rename lists from the sidebar menu — Sourabh Singh Rawat (`@pine/items-service`, `@pine/pine-web`)
- 36d1802c: refactor: rename Project domain to List — Sourabh Singh Rawat (`@pine/authorization`, `@pine/authorization-service`, `@pine/common`, `@pine/events`, `@pine/identity-web`, `@pine/items-service`, `@pine/pine-web`, `@pine/platform-web`)

### Patch

- ca3dd7ed: refactor(items-service): move attachments into features/attachments — Sourabh Singh Rawat (`@pine/items-service`)
- ac2682ae: refactor(items-service): move sub-items into features/sub-items — Sourabh Singh Rawat (`@pine/items-service`)

### Packages

- `@pine/api-gateway@0.4.4`
- `@pine/audit-service@0.1.1`
- `@pine/authorization@0.7.0`
- `@pine/authorization-service@0.7.0`
- `@pine/common@1.1.0`
- `@pine/data-gateway@0.1.4`
- `@pine/events@1.1.0`
- `@pine/identity-service@0.6.3`
- `@pine/identity-web@0.6.4`
- `@pine/items-service@1.1.0`
- `@pine/pine-web@0.9.0`
- `@pine/platform-service@0.5.3`
- `@pine/platform-web@0.5.4`
- `@pine/server@1.1.4`

## v2026.09.24.1

### Major

- 2c3a46a8: feat(items): rename issue domain to item across service, events, and web — Sourabh Singh Rawat (`@pine/audit-service`, `@pine/authorization-service`, `@pine/common`, `@pine/events`, `@pine/items-service`, `@pine/notification-service`, `@pine/outbox`, `@pine/pine-web`)

### Minor

- 5f02f5a1: feat(auth): share OIDC browser sign-in helpers across web apps — Sourabh Singh Rawat (`@pine/auth`, `@pine/pine-web`, `@pine/platform-web`)
- 9ee99da6: feat(auth): share PKCE helpers via @pine/auth — Sourabh Singh Rawat (`@pine/auth`, `@pine/pine-web`, `@pine/platform-web`)
- 17a7a3db: feat(audit): show create activity on issue detail — Sourabh Singh Rawat (`@pine/audit-service`, `@pine/pine-web`)
- 7fb0820c: feat(audit): sync item updated events into audit logs — Sourabh Singh Rawat (`@pine/audit-service`)
- c231b16e: feat(audit): create audit-service microservice — Sourabh Singh Rawat (`@pine/audit-service`)
- 9a92efeb: feat(issue-list): edit due date from list with Calendar — Sourabh Singh Rawat (`@pine/issues-service`, `@pine/pine-web`, `@pine/ui`)
- be877960: feat(issues): schedule IssueUpdatedEvent on update — Sourabh Singh Rawat (`@pine/events`, `@pine/issues-service`)
- 93a9ef9b: feat(ui): add Menu and MenuItem components — Sourabh Singh Rawat (`@pine/pine-web`, `@pine/ui`)
- e163b5bc: feat(items): upload and link attachments on item detail — Sourabh Singh Rawat (`@pine/items-service`, `@pine/pine-web`)
- 15ea4dd6: feat(ui): stabilize IssueList menu, grouping, and wavy loader — Sourabh Singh Rawat (`@pine/pine-web`, `@pine/ui`)

### Patch

- 20b381ad: feat(issues): show nested children in project issue list — Sourabh Singh Rawat (`@pine/issues-service`, `@pine/pine-web`, `@pine/ui`)
- cda60a62: feat(ui): add loading indicators and progress components — Sourabh Singh Rawat (`@pine/ui`)
- 8cfee8bc: feat(ui): add Select form component — Sourabh Singh Rawat (`@pine/ui`)
- 1b8f27bc: fix(ui): close Menu on outside click with invisible backdrop — Sourabh Singh Rawat (`@pine/ui`)
- 9093046a: refactor(identity): validate oauth routes via typebox schemas — Sourabh Singh Rawat (`@pine/identity-service`)
- 506bed82: fix(identity): emit email-verified for admin creates and sync on verified only — Sourabh Singh Rawat (`@pine/audit-service`, `@pine/identity-service`, `@pine/platform-service`)
- 39e7d6c2: feat(pine-web): show identity profile photo in AccountSwitcher — Sourabh Singh Rawat (`@pine/pine-web`)
- 3856e455: feat(pine-web): issue list leading status icon menu — Sourabh Singh Rawat (`@pine/pine-web`)
- 097dbd44: feat(pine-web): edit issue name from list view — Sourabh Singh Rawat (`@pine/pine-web`)
- dc562518: feat(pine-web): redirect profile to identity-web — Sourabh Singh Rawat (`@pine/pine-web`)
- e44b19df: refactor(ui): modularize DataTable into subcomponents with context — Sourabh Singh Rawat (`@pine/ui`)

### Packages

- `@pine/api-gateway@0.4.3`
- `@pine/attachment-scanner-service@0.1.3`
- `@pine/attachment-service@0.5.3`
- `@pine/audit-service@0.1.0`
- `@pine/auth@0.2.0`
- `@pine/authorization-service@0.6.1`
- `@pine/common@1.0.0`
- `@pine/data-gateway@0.1.3`
- `@pine/events@1.0.0`
- `@pine/identity@0.3.2`
- `@pine/identity-service@0.6.2`
- `@pine/identity-web@0.6.3`
- `@pine/items-service@1.0.0`
- `@pine/notification-service@0.4.3`
- `@pine/outbox@0.1.4`
- `@pine/pine-web@0.8.0`
- `@pine/platform-service@0.5.2`
- `@pine/platform-web@0.5.3`
- `@pine/security@0.1.3`
- `@pine/server@1.1.3`
- `@pine/ui@0.3.0`

## v2026.09.20.1

### Minor

- c29925a7: feat(ui): add AppBar with editable issue title on issue page — Sourabh Singh Rawat (`@pine/pine-web`, `@pine/ui`)
- 595f7f5f: feat(ui): TanStack Table v9 DataTable with status-grouped issue list — Sourabh Singh Rawat (`@pine/pine-web`, `@pine/ui`)

### Patch

- 6b83fcef: feat(issues): soft-delete with project delete authz — Sourabh Singh Rawat (`@pine/issues-service`, `@pine/pine-web`)
- a5fe0e94: feat(pine-web): edit issue priority from list view — Sourabh Singh Rawat (`@pine/pine-web`)
- c6455626: refactor(pine-web): remove unused AppRail — Sourabh Singh Rawat (`@pine/pine-web`)
- a4ffbd40: feat(ui): align md3 theme tokens and typings with shared m3 specification — Sourabh Singh Rawat (`@pine/ui`)

### Packages

- `@pine/identity-web@0.6.2`
- `@pine/issues-service@0.6.1`
- `@pine/pine-web@0.7.2`
- `@pine/platform-web@0.5.2`
- `@pine/ui@0.2.0`

## v2026.09.19.1

### Minor

- 908358f7: feat(authz): space/project/item graph + IssueCreated outbox — Sourabh Singh Rawat (`@pine/authorization`, `@pine/authorization-service`, `@pine/issues-service`)

### Patch

- 5e0aff49: chore(deps): update @fastify/swagger-ui to 6.1.1 — Sourabh Singh Rawat (`@pine/api-gateway`)
- 522b0cd6: chore(deps): upgrade fastify to 5.12.4 — Sourabh Singh Rawat (`@pine/api-gateway`, `@pine/common`, `@pine/data-gateway`, `@pine/server`)
- 961e77fb: chore(deps): pin @graphql-codegen/cli to 7.4.1 — Sourabh Singh Rawat (`@pine/identity-web`, `@pine/pine-web`, `@pine/platform-web`)
- b4b54ab2: chore(pine-web): remove unused firebase dependency — Sourabh Singh Rawat (`@pine/pine-web`)
- c0fa5093: chore(deps): remove deprecated @hey-api/client-axios — Sourabh Singh Rawat (`@pine/identity-web`, `@pine/pine-web`, `@pine/platform-web`)
- 14fb8632: chore(vitest): upgrade to 5.0.0 — Sourabh Singh Rawat (`@pine/attachment-scanner-service`, `@pine/attachment-service`, `@pine/authorization-service`, `@pine/events`, `@pine/identity`, `@pine/identity-service`, `@pine/issues-service`, `@pine/notification-service`, `@pine/outbox`, `@pine/platform-service`)

### Packages

- `@pine/api-gateway@0.4.2`
- `@pine/attachment-scanner-service@0.1.2`
- `@pine/attachment-service@0.5.2`
- `@pine/authorization@0.6.0`
- `@pine/authorization-service@0.6.0`
- `@pine/common@0.1.2`
- `@pine/data-gateway@0.1.2`
- `@pine/events@0.5.1`
- `@pine/identity@0.3.1`
- `@pine/identity-service@0.6.1`
- `@pine/identity-web@0.6.1`
- `@pine/issues-service@0.6.0`
- `@pine/notification-service@0.4.2`
- `@pine/outbox@0.1.3`
- `@pine/pine-web@0.7.1`
- `@pine/platform-service@0.5.1`
- `@pine/platform-web@0.5.1`
- `@pine/server@1.1.2`

## v2026.09.12.1

### Minor

- 44ebe40c: feat(identity): allow creating a profile from Personal info — Sourabh Singh Rawat (`@pine/common`, `@pine/identity-service`, `@pine/identity-web`)
- e1f5abf1: feat(identity-web): show email and verification status on Personal info — Sourabh Singh Rawat (`@pine/identity-web`)
- 48e508cf: feat(platform): provision personal workspace on user registration — Sourabh Singh Rawat (`@pine/platform-service`)
- e5726cc1: feat(spaces): nest projects under spaces with required spaceId — Sourabh Singh Rawat (`@pine/authorization`, `@pine/authorization-service`, `@pine/events`, `@pine/issues-service`, `@pine/pine-web`)
- 9b1b2658: chore(web): rename erp-web to pine-web — Sourabh Singh Rawat (`@pine/api-gateway`, `@pine/attachment-service`, `@pine/authorization-service`, `@pine/data-gateway`, `@pine/identity-service`, `@pine/issues-service`, `@pine/pine-web`, `@pine/platform-service`)
- 198f9306: refactor(platform): rename organization to workspace — Sourabh Singh Rawat (`@pine/api-gateway`, `@pine/attachment`, `@pine/attachment-scanner-service`, `@pine/attachment-service`, `@pine/authorization`, `@pine/authorization-service`, `@pine/events`, `@pine/identity`, `@pine/identity-service`, `@pine/issues-service`, `@pine/pine-web`, `@pine/platform-service`, `@pine/platform-web`, `@pine/server`)
- 03c9cf5a: feat(spaces): add Space create and sidebar under workspace — Sourabh Singh Rawat (`@pine/authorization`, `@pine/authorization-service`, `@pine/events`, `@pine/issues-service`, `@pine/pine-web`)

### Patch

- 47e114e1: chore(dev): attach debug workflow and fix Fastify ajv-compiler — Sourabh Singh Rawat (`@pine/server`)
- f272fa5a: feat(ui): add M3 foundation tokens for shape, color, type, motion — Sourabh Singh Rawat (`@pine/pine-web`, `@pine/platform-web`, `@pine/ui`)
- a6165645: fix(pine-web): make nested space projects clickable in sidebar — Sourabh Singh Rawat (`@pine/pine-web`)

### Packages

- `@pine/api-gateway@0.4.1`
- `@pine/attachment@0.3.0`
- `@pine/attachment-processing-service@0.0.1`
- `@pine/attachment-scanner-service@0.1.1`
- `@pine/attachment-service@0.5.1`
- `@pine/authorization@0.5.0`
- `@pine/authorization-service@0.5.0`
- `@pine/common@0.1.1`
- `@pine/data-gateway@0.1.1`
- `@pine/events@0.5.0`
- `@pine/identity@0.3.0`
- `@pine/identity-service@0.6.0`
- `@pine/identity-web@0.6.0`
- `@pine/issues-service@0.5.0`
- `@pine/notification-service@0.4.1`
- `@pine/outbox@0.1.2`
- `@pine/pine-web@0.7.0`
- `@pine/platform-service@0.5.0`
- `@pine/platform-web@0.5.0`
- `@pine/security@0.1.2`
- `@pine/server@1.1.1`
- `@pine/ui@0.1.1`

## v2026.08.30.1

### Minor

- 01ba62c4: feat(attachment-scanner): implement attachment scanner service and malware scanning pipeline — Sourabh Singh Rawat (`@pine/attachment`, `@pine/attachment-scanner-service`, `@pine/attachment-service`, `@pine/events`, `@pine/identity-service`, `@pine/identity-web`)
- 3925de4f: feat(attachment): add attachment service upload target, proxy, and outbox event integration — Sourabh Singh Rawat (`@pine/attachment-service`, `@pine/data-gateway`, `@pine/events`, `@pine/identity-web`, `@pine/server`)
- bfaca3c4: feat(identity): extract profiles with name, events, and authz sync — Sourabh Singh Rawat (`@pine/authorization`, `@pine/authorization-service`, `@pine/events`, `@pine/identity-service`, `@pine/identity-web`)
- 715fce74: refactor(identity): replace identity-client with HttpIdentityClient — Sourabh Singh Rawat (`@pine/attachment-service`, `@pine/identity`, `@pine/identity-service`, `@pine/issues-service`, `@pine/platform-service`, `@pine/server`)
- d01fc4c5: feat(identity): implement profile photo upload flow and dev tls support — Sourabh Singh Rawat, sourabh-singh-rawat (`@pine/api-gateway`, `@pine/attachment`, `@pine/attachment-service`, `@pine/authorization`, `@pine/authorization-service`, `@pine/common`, `@pine/data-gateway`, `@pine/erp-web`, `@pine/events`, `@pine/identity`, `@pine/identity-service`, `@pine/identity-web`, `@pine/issues-service`, `@pine/notification-service`, `@pine/platform-service`, `@pine/platform-web`, `@pine/server`)
- bee71c32: feat(platform): add identity relations page and graph — Sourabh Singh Rawat (`@pine/authorization-service`, `@pine/platform-service`, `@pine/platform-web`)
- 35cec8af: feat(identity-web): add navbar and gender to personal info — Sourabh Singh Rawat (`@pine/identity-web`)
- f3ae7b4a: feat(organization): persist default org preference and tenant/org request headers — Sourabh Singh Rawat (`@pine/api-gateway`, `@pine/erp-web`, `@pine/identity`, `@pine/identity-service`, `@pine/platform-service`, `@pine/server`)
- 77b700a6: feat(organization): add org switcher with nested memberships and tenant.read_list — Sourabh Singh Rawat (`@pine/authorization`, `@pine/authorization-service`, `@pine/erp-web`, `@pine/platform-service`)
- 8773588d: feat(platform): add organization relations and authorization sync — Sourabh Singh Rawat (`@pine/authorization`, `@pine/authorization-service`, `@pine/events`, `@pine/platform-service`, `@pine/platform-web`)
- c2b64b6c: feat(platform): rename members to relations and publish relation created via outbox — Sourabh Singh Rawat (`@pine/authorization-service`, `@pine/events`, `@pine/platform-service`, `@pine/platform-web`)
- baef746c: chore: remove inventory-service and product-service — Sourabh Singh Rawat (`@pine/api-gateway`, `@pine/authorization`, `@pine/authorization-service`, `@pine/erp-web`, `@pine/events`, `@pine/identity-service`, `@pine/outbox`)
- 1fad54fb: feat(security): require mTLS between gateways and backend services — Sourabh Singh Rawat, sourabh-singh-rawat (`@pine/api-gateway`, `@pine/attachment-scanner-service`, `@pine/attachment-service`, `@pine/authorization-service`, `@pine/common`, `@pine/data-gateway`, `@pine/identity-service`, `@pine/issues-service`, `@pine/notification-service`, `@pine/platform-service`, `@pine/server`)

### Patch

- aa9d59e8: feat(attachment): publish quarantined outbox event on upload completion — Sourabh Singh Rawat (`@pine/attachment`, `@pine/attachment-service`, `@pine/events`)
- bad0ca63: chore(authz): suppress sonar class-name lint on keto namespaces — Sourabh Singh Rawat (`@pine/authorization-service`)
- 061d3ba1: refactor: prefix identity sync consumers with service names — Sourabh Singh Rawat, sourabh-singh-rawat (`@pine/attachment-service`, `@pine/issues-service`, `@pine/notification-service`, `@pine/platform-service`)

### Packages

- `@pine/api-gateway@0.4.0`
- `@pine/attachment@0.2.0`
- `@pine/attachment-processing-service@0.0.1`
- `@pine/attachment-scanner-service@0.1.0`
- `@pine/attachment-service@0.5.0`
- `@pine/authorization@0.4.0`
- `@pine/authorization-service@0.4.0`
- `@pine/common@0.1.0`
- `@pine/data-gateway@0.1.0`
- `@pine/erp-web@0.6.0`
- `@pine/events@0.4.0`
- `@pine/identity@0.2.0`
- `@pine/identity-service@0.5.0`
- `@pine/identity-web@0.5.0`
- `@pine/issues-service@0.4.0`
- `@pine/notification-service@0.4.0`
- `@pine/outbox@0.1.2`
- `@pine/platform-service@0.4.0`
- `@pine/platform-web@0.4.0`
- `@pine/security@0.1.2`
- `@pine/server@1.1.0`

## v2026.08.16.1

### Minor

- 617eacc9: feat(platform): identities and graph membership relations — Sourabh Singh Rawat (`@pine/authorization`, `@pine/authorization-service`, `@pine/common`, `@pine/erp-web`, `@pine/events`, `@pine/platform-service`, `@pine/platform-web`)
- b0911f8d: feat(platform): members and roles for platform, tenant, and organization — Sourabh Singh Rawat (`@pine/authorization`, `@pine/authorization-service`, `@pine/erp-web`, `@pine/events`, `@pine/platform-service`, `@pine/platform-web`)
- 1dd2bfb9: refactor(platform): platform-web, platform-service, and erp app rail — Sourabh Singh Rawat (`@pine/common`, `@pine/erp-web`, `@pine/platform-service`, `@pine/platform-web`)
- f1cb277e: feat(tenants): tenant and organization detail with create org — Sourabh Singh Rawat (`@pine/platform-service`, `@pine/platform-web`)

### Patch

- 6960ceb8: fix(authz): namespace tenant capabilities under platform — Sourabh Singh Rawat (`@pine/authorization`, `@pine/platform-service`)

### Packages

- `@pine/api-gateway@0.3.3`
- `@pine/attachment-service@0.4.1`
- `@pine/authorization@0.3.0`
- `@pine/authorization-service@0.3.0`
- `@pine/common@0.0.3`
- `@pine/erp-web@0.5.0`
- `@pine/events@0.3.0`
- `@pine/identity-client@0.1.1`
- `@pine/identity-service@0.4.2`
- `@pine/inventory-service@0.3.1`
- `@pine/issues-service@0.3.1`
- `@pine/notification-service@0.3.1`
- `@pine/outbox@0.1.1`
- `@pine/platform-service@0.3.0`
- `@pine/platform-web@0.3.0`
- `@pine/product-service@0.2.1`
- `@pine/security@0.1.1`
- `@pine/server@1.0.1`

## v2026.08.11.1

### Minor

- 07bb3bce: feat(authz): keto subject-set grants, role capability checks, and local session identity ids — Sourabh Singh Rawat (`@pine/api-gateway`, `@pine/authorization`, `@pine/authorization-service`, `@pine/identity-service`)
- 1933c6c7: feat(authz): share requireCapability and InsufficientPermissionError — Sourabh Singh Rawat (`@pine/authorization`, `@pine/authorization-service`)
- 1ca92d74: feat(organization): require capability checks on organization service methods — Sourabh Singh Rawat (`@pine/organization-service`)

### Packages

- `@pine/api-gateway@0.3.2`
- `@pine/authorization@0.2.0`
- `@pine/authorization-service@0.2.0`
- `@pine/identity-service@0.4.1`
- `@pine/organization-service@0.2.0`

## v2026.08.09.1

### Major

- 689a980f: refactor: rename @pine/http to @pine/server and merge graphql-core — Sourabh Singh Rawat (`@pine/api-gateway`, `@pine/attachment-service`, `@pine/authorization-service`, `@pine/events`, `@pine/identity-client`, `@pine/identity-service`, `@pine/inventory-service`, `@pine/issues-service`, `@pine/notification-service`, `@pine/organization-service`, `@pine/product-service`, `@pine/security`, `@pine/server`)

### Minor

- 11abe4b6: feat(product): add product-service with dedicated database, gateway proxy and bootstrap; add brand operations — Sourabh Singh Rawat (`@pine/api-gateway`, `@pine/inventory-service`, `@pine/product-service`)
- de6a3b1d: feat(authz): organizations, authorization, roles, keto, and admin-web — Sourabh Singh Rawat (`@pine/admin-web`, `@pine/api-gateway`, `@pine/authorization`, `@pine/authorization-service`, `@pine/erp-web`, `@pine/events`, `@pine/identity-service`, `@pine/identity-web`, `@pine/organization-service`, `@pine/ui`)
- 2cd57360: refactor(authz): role capabilities model, drop permissions — Sourabh Singh Rawat (`@pine/admin-web`, `@pine/authorization`, `@pine/authorization-service`, `@pine/events`)
- 8ae018c6: feat(product): publish brand events; project brands and products in inventory — Sourabh Singh Rawat (`@pine/events`, `@pine/inventory-service`, `@pine/product-service`)
- cffc076f: feat(commands): add initial empty commands — Sourabh Singh Rawat (`@pine/cli`)
- 14a1fb56: Identity email verification and session APIs; migrate services to Drizzle with local identities tables; remove workspace multi-tenancy from issues and ERP web — Sourabh Singh Rawat (`@pine/attachment-service`, `@pine/erp-web`, `@pine/events`, `@pine/identity-client`, `@pine/identity-service`, `@pine/identity-web`, `@pine/inventory-service`, `@pine/issues-service`, `@pine/notification-service`, `@pine/product-service`, `@pine/security`)
- 4b72801d: refactor(identity): drop local email, add profile names, register with username — Sourabh Singh Rawat (`@pine/attachment-service`, `@pine/events`, `@pine/identity-client`, `@pine/identity-service`, `@pine/identity-web`, `@pine/issues-service`, `@pine/product-service`, `@pine/security`, `@pine/server`)
- 0acc6d39: fix(identity): login returns 204/302 and OAuth redirect via response — Sourabh Singh Rawat (`@pine/identity-service`, `@pine/identity-web`)
- 9c0d1872: feat(web): merge issues-web and inventory-web into a single erp-web app Product UI lives in `@pine/erp-web` (port 3001) with OIDC PKCE auth and an inventory route shell. Backend CORS and invite URLs use `ERP_WEB_URL` instead of separate issues/inventory web origins. — sourabh-singh-rawat (`@pine/api-gateway`, `@pine/attachment-service`, `@pine/erp-web`, `@pine/inventory-service`, `@pine/issues-service`)
- 84ae79f3: refactor(events): rename NATS subscribers to consumers — Sourabh Singh Rawat (`@pine/attachment-service`, `@pine/events`, `@pine/inventory-service`, `@pine/issues-service`, `@pine/notification-service`, `@pine/product-service`)
- cafe973b: feat(admin-web): manage role capabilities and add navbar — Sourabh Singh Rawat (`@pine/admin-web`, `@pine/authorization-service`)
- d175229d: refactor(notification): remove email sending, events, and emails table — Sourabh Singh Rawat (`@pine/common`, `@pine/events`, `@pine/notification-service`)
- 7ed63fe1: fix(oauth): 302 authorize redirect and require explicit DATABASE_URL env vars — Sourabh Singh Rawat (`@pine/attachment-service`, `@pine/identity-service`, `@pine/inventory-service`, `@pine/inventory-web`, `@pine/issues-service`, `@pine/mail-service`)
- fff12b7a: feat(outbox): schedule identity registration and brand create via outbox — Sourabh Singh Rawat (`@pine/events`, `@pine/identity-service`, `@pine/inventory-service`, `@pine/product-service`)
- 04d33c3d: feat(product): add category create/update with events and GraphQL — Sourabh Singh Rawat (`@pine/events`, `@pine/product-service`)
- 7c958b1c: feat(product): create product with default unit; publish nats now publish cloud events — Sourabh Singh Rawat (`@pine/attachment-service`, `@pine/events`, `@pine/identity-service`, `@pine/inventory-service`, `@pine/issues-service`, `@pine/notification-service`, `@pine/product-service`)
- d206a7c9: refactor: rename @pine/http-core to @pine/http — Sourabh Singh Rawat (`@pine/api-gateway`, `@pine/attachment-service`, `@pine/authorization-service`, `@pine/common`, `@pine/events`, `@pine/identity-service`, `@pine/inventory-service`, `@pine/issues-service`, `@pine/notification-service`, `@pine/organization-service`, `@pine/product-service`, `@pine/security`, `@pine/server`)
- 179562aa: feat(outbox): transactional outbox for product events; project product units — Sourabh Singh Rawat (`@pine/events`, `@pine/inventory-service`, `@pine/outbox`, `@pine/product-service`)
- b92cb727: feat(cli): add .NET pine cli — Sourabh Singh Rawat (`@pine/cli`)

### Patch

- d67c1e11: feat(authz): sync keto relationship tuples on role capability updated event — Sourabh Singh Rawat (`@pine/authorization-service`, `@pine/events`)
- 5b5506ba: chore(fmt): format code — Sourabh Singh Rawat (`@pine/attachment-service`, `@pine/authorization`, `@pine/authorization-service`, `@pine/common`, `@pine/identity-service`, `@pine/inventory-service`, `@pine/issues-service`, `@pine/notification-service`, `@pine/organization-service`, `@pine/product-service`)
- 5bd9a1a7: refactor(security): remove Hash, argon2, and awilix — Sourabh Singh Rawat (`@pine/security`)

### Packages

- `@pine/admin-web@0.2.0`
- `@pine/api-gateway@0.3.1`
- `@pine/attachment-service@0.4.0`
- `@pine/authorization@0.1.0`
- `@pine/authorization-service@0.1.0`
- `@pine/cli@0.1.0`
- `@pine/common@0.0.2`
- `@pine/erp-web@0.4.0`
- `@pine/events@0.2.0`
- `@pine/identity-client@0.1.0`
- `@pine/identity-service@0.4.0`
- `@pine/identity-web@0.4.0`
- `@pine/inventory-service@0.3.0`
- `@pine/issues-service@0.3.0`
- `@pine/notification-service@0.3.0`
- `@pine/organization-service@0.1.0`
- `@pine/outbox@0.1.0`
- `@pine/product-service@0.2.0`
- `@pine/security@0.1.0`
- `@pine/server@1.0.0`
- `@pine/ui@0.1.0`

## v2026.07.26.2

### Minor

- 4518c751: feat(inventory): add inventory-service with gateway proxy, bootstrap env modules, and OAuth token cookies — sourabh-singh-rawat (`@pine/api-gateway`, `@pine/attachment-service`, `@pine/http-core`, `@pine/identity-service`, `@pine/inventory-service`, `@pine/inventory-web`, `@pine/issues-service`, `@pine/issues-web`, `@pine/mail-service`)
- 2f4b756a: refactor(env): unify root .env and URL-based service bootstrap — sourabh-singh-rawat (`@pine/api-gateway`, `@pine/attachment-service`, `@pine/identity-service`, `@pine/identity-web`, `@pine/inventory-service`, `@pine/inventory-web`, `@pine/issues-service`, `@pine/issues-web`, `@pine/mail-service`)

### Packages

- `@pine/api-gateway@0.3.0`
- `@pine/attachment-service@0.3.0`
- `@pine/http-core@0.2.1`
- `@pine/identity-service@0.3.0`
- `@pine/identity-web@0.3.0`
- `@pine/inventory-service@0.2.0`
- `@pine/inventory-web@0.3.0`
- `@pine/issues-service@0.2.0`
- `@pine/issues-web@0.2.0`
- `@pine/mail-service@0.2.0`

## v2026.07.26.1

### Minor

- 643f8616: feat(identity): add OAuth consent, token exchange, and client auth flows — sourabh-singh-rawat (`@pine/api-gateway`, `@pine/identity-service`, `@pine/identity-web`, `@pine/inventory-web`, `@pine/issues-web`)
- a291ebd0: feat(api-gateway): add schemas:watch compose and supergraph hot-reload — sourabh-singh-rawat (`@pine/api-gateway`)
- 6214051f: refactor(issues-service): rename package and align layout with identity — sourabh-singh-rawat (`@pine/issues-service`)
- bc60210f: refactor: rename packages to events/http-core, add CloudEvents and Hydra OAuth — sourabh-singh-rawat (`@pine/attachment-service`, `@pine/events`, `@pine/http-core`, `@pine/identity-service`, `@pine/issues-service`, `@pine/issues-web`, `@pine/mail-service`)
- 444ae048: feat(identity): add session cookies with me and logout — sourabh-singh-rawat (`@pine/identity-service`, `@pine/identity-web`)
- 03e5c353: feat(identity): move registration to REST and implement Kratos login — sourabh-singh-rawat (`@pine/api-gateway`, `@pine/attachment-service`, `@pine/identity-service`, `@pine/identity-web`, `@pine/issues-service`)

### Packages

- `@pine/api-gateway@0.2.0`
- `@pine/attachment-service@0.2.0`
- `@pine/events@0.1.0`
- `@pine/http-core@0.2.0`
- `@pine/identity-service@0.2.0`
- `@pine/identity-web@0.2.0`
- `@pine/inventory-web@0.2.0`
- `@pine/issues-service@0.1.0`
- `@pine/issues-web@0.1.0`
- `@pine/mail-service@0.1.0`
- `@pine/orm@0.0.2`
- `@pine/security@0.0.2`

## v2026.07.23.1

### Minor

- 36764cc5: feat(inventory-web): Add openapi & graphql codegen — sourabh-singh-rawat (`@pine/inventory-web`)

### Packages

- `@pine/api-gateway@0.1.0`
- `@pine/attachment-service@0.1.0`
- `@pine/comm@0.0.1`
- `@pine/common@0.0.1`
- `@pine/errors@0.1.0`
- `@pine/event-bus@0.0.1`
- `@pine/forms@0.0.1`
- `@pine/graphql-core@0.0.1`
- `@pine/identity-service@0.1.0`
- `@pine/identity-web@0.1.0`
- `@pine/inventory-web@0.1.0`
- `@pine/issue-web@0.0.1`
- `@pine/issues@0.0.1`
- `@pine/mail@0.0.1`
- `@pine/observability@0.1.0`
- `@pine/orm@0.0.1`
- `@pine/security@0.0.1`
- `@pine/server-core@0.1.0`
