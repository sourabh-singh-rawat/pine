# @pine/server

## 1.1.4

### Patch Changes

- Updated dependencies [36d1802]
  - @pine/common@1.1.0

## 1.1.3

### Patch Changes

- Updated dependencies [2c3a46a]
  - @pine/common@1.0.0

## 1.1.2

### Patch Changes

- 522b0cd: chore(deps): upgrade fastify to 5.12.4
- Updated dependencies [522b0cd]
  - @pine/common@0.1.2

## 1.1.1

### Patch Changes

- 47e114e: chore(dev): attach debug workflow and fix Fastify ajv-compiler
- 198f930: refactor(platform): rename organization to workspace
- Updated dependencies [44ebe40]
  - @pine/common@0.1.1

## 1.1.0

### Minor Changes

- 715fce7: refactor(identity): replace identity-client with HttpIdentityClient
- f3ae7b4: feat(organization): persist default org preference and tenant/org request headers
- 1fad54f: feat(security): require mTLS between gateways and backend services

### Patch Changes

- 3925de4: feat(attachment): add attachment service upload target, proxy, and outbox event integration
- d01fc4c: feat(identity): implement profile photo upload flow and dev tls support
- Updated dependencies [d01fc4c]
- Updated dependencies [1fad54f]
  - @pine/common@0.1.0

## 1.0.1

### Patch Changes

- Updated dependencies [617eacc]
- Updated dependencies [1dd2bfb]
  - @pine/common@0.0.3

## 1.0.0

### Major Changes

- 689a980: refactor: rename @pine/http to @pine/server and merge graphql-core

### Minor Changes

- d206a7c: refactor: rename @pine/http-core to @pine/http

### Patch Changes

- 4b72801: refactor(identity): drop local email, add profile names, register with username
- Updated dependencies [5b5506b]
- Updated dependencies [d175229]
- Updated dependencies [d206a7c]
  - @pine/common@0.0.2

## 0.2.1

### Patch Changes

- dfa43fd: feat(inventory): add inventory-service with gateway proxy, bootstrap env modules, and OAuth token cookies

## 0.2.0

### Minor Changes

- d05915a: refactor: rename packages to events/http, add CloudEvents and Hydra OAuth

## 0.1.0

### Minor Changes

- 68dd71c: feat: rebuild identity on Kratos and replace gateway with api-gateway

### Patch Changes

- Updated dependencies [68dd71c]
  - @pine/common@0.0.1
