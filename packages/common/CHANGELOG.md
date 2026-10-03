# @pine/common

## 1.3.0

### Minor Changes

- 2f61d7c: feat(common): retry NATS and Postgres connect at boot
- 47d8722: feat(http): return ApiResponse data and errors envelope on JSON APIs

### Patch Changes

- 942d839: chore(deps): bump graphql to 17 and refresh related pins
- 87d3856: fix(packages): point @pine/errors and @pine/common exports at dist
- ad7c767: feat(items): within-status list reorder and item cleanup

## 1.2.1

### Patch Changes

- 71ab521: feat(attachments): add image processing service and HTTP scan callback
- 98a6750: feat(items): set attachment SCANNING/FAILED, sweep stuck, fail UX

## 1.2.0

### Minor Changes

- 4200ae7: feat(item-statuses): manage list statuses with drag reorder

## 1.1.0

### Minor Changes

- 36d1802: refactor: rename Project domain to List

## 1.0.0

### Major Changes

- 2c3a46a: feat(items): rename issue domain to item across service, events, and web

## 0.1.2

### Patch Changes

- 522b0cd: chore(deps): upgrade fastify to 5.12.4

## 0.1.1

### Patch Changes

- 44ebe40: feat(identity): allow creating a profile from Personal info

## 0.1.0

### Minor Changes

- 1fad54f: feat(security): require mTLS between gateways and backend services

### Patch Changes

- d01fc4c: feat(identity): implement profile photo upload flow and dev tls support

## 0.0.3

### Patch Changes

- 617eacc: feat(platform): identities and graph membership relations
- 1dd2bfb: refactor(platform): platform-web, platform-service, and erp app rail

## 0.0.2

### Patch Changes

- 5b5506b: chore(fmt): format code
- d175229: refactor(notification): remove email sending, events, and emails table
- d206a7c: refactor: rename @pine/http-core to @pine/http

## 0.0.1

### Patch Changes

- 68dd71c: feat: rebuild identity on Kratos and replace gateway with api-gateway
