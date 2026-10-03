# @pine/oauth-service

## 0.9.0

### Minor Changes

- 47d8722: feat(http): return ApiResponse data and errors envelope on JSON APIs
- c9a93c8: feat(oauth-service): add OIDC discovery and JWKS public endpoints

### Patch Changes

- 6c30d89: refactor(oauth-service): move Hydra helpers into ory-hydra/utils
- Updated dependencies [2f61d7c]
- Updated dependencies [942d839]
- Updated dependencies [87d3856]
- Updated dependencies [47d8722]
- Updated dependencies [ad7c767]
- Updated dependencies [b5760be]
  - @pine/common@1.3.0
  - @pine/observability@0.1.1
  - @pine/server@1.2.0
  - @pine/errors@0.1.1
  - @pine/identity@0.4.0

## 0.8.0

### Minor Changes

- be64deb: feat(oauth): facade Hydra authorize and interactive consent
- b376e83: feat(oauth-service): extract OAuth/OIDC Hydra APIs from identity-service

### Patch Changes

- 9ece880: fix(oauth): rethrow hydra error explicitly to satisfy return checks
- 3a5881e: chore(oauth): move consent scope copy into constants
- 003a5e1: feat(oauth): provide consent scope details from server
