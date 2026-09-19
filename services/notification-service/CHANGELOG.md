# @pine/notification-service

## 0.4.2

### Patch Changes

- 14fb863: chore(vitest): upgrade to 5.0.0
- Updated dependencies [522b0cd]
- Updated dependencies [14fb863]
  - @pine/common@0.1.2
  - @pine/server@1.1.2
  - @pine/events@0.5.1

## 0.4.1

### Patch Changes

- Updated dependencies [47e114e]
- Updated dependencies [44ebe40]
- Updated dependencies [e5726cc]
- Updated dependencies [198f930]
- Updated dependencies [03c9cf5]
  - @pine/server@1.1.1
  - @pine/common@0.1.1
  - @pine/events@0.5.0

## 0.4.0

### Minor Changes

- 1fad54f: feat(security): require mTLS between gateways and backend services

### Patch Changes

- d01fc4c: feat(identity): implement profile photo upload flow and dev tls support
- 061d3ba: refactor: prefix identity sync consumers with service names
- Updated dependencies [aa9d59e]
- Updated dependencies [01ba62c]
- Updated dependencies [3925de4]
- Updated dependencies [bfaca3c]
- Updated dependencies [715fce7]
- Updated dependencies [d01fc4c]
- Updated dependencies [f3ae7b4]
- Updated dependencies [8773588]
- Updated dependencies [c2b64b6]
- Updated dependencies [baef746]
- Updated dependencies [1fad54f]
  - @pine/events@0.4.0
  - @pine/server@1.1.0
  - @pine/common@0.1.0

## 0.3.1

### Patch Changes

- Updated dependencies [617eacc]
- Updated dependencies [b0911f8]
- Updated dependencies [1dd2bfb]
  - @pine/events@0.3.0
  - @pine/common@0.0.3
  - @pine/server@1.0.1

## 0.3.0

### Minor Changes

- 14a1fb5: Identity email verification and session APIs; migrate services to Drizzle with local identities tables; remove workspace multi-tenancy from issues and ERP web
- d175229: refactor(notification): remove email sending, events, and emails table

### Patch Changes

- 5b5506b: chore(fmt): format code
- 84ae79f: refactor(events): rename NATS subscribers to consumers
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
- Updated dependencies [179562a]
  - @pine/events@0.2.0
  - @pine/common@0.0.2
  - @pine/server@1.0.0

## 0.2.0

### Minor Changes

- 1ab5ff4: refactor(env): unify root .env and URL-based service bootstrap

### Patch Changes

- dfa43fd: feat(inventory): add inventory-service with gateway proxy, bootstrap env modules, and OAuth token cookies
- Updated dependencies [dfa43fd]
  - @pine/server@0.2.1

## 0.1.0

### Minor Changes

- d05915a: refactor: rename packages to events/http, add CloudEvents and Hydra OAuth

### Patch Changes

- Updated dependencies [d05915a]
  - @pine/events@0.1.0
  - @pine/server@0.2.0
  - @pine/orm@0.0.2
  - @pine/security@0.0.2

## 0.0.1

### Patch Changes

- 68dd71c: feat: rebuild identity on Kratos and replace gateway with api-gateway
- Updated dependencies [68dd71c]
  - @pine/common@0.0.1
  - @pine/events@0.0.1
  - @pine/orm@0.0.1
  - @pine/security@0.0.1
  - @pine/server-core@0.1.0
