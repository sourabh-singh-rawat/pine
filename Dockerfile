# syntax=docker/dockerfile:1

ARG NODE_VERSION=26.10.0
ARG PNPM_VERSION=12.6.0
ARG TURBO_VERSION=2.10.9
ARG TSX_VERSION=4.23.1
ARG SERVICE
ARG SERVICE_DIR

FROM node:${NODE_VERSION}-alpine AS pnpm
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

FROM pnpm AS base
ARG TURBO_VERSION
RUN npm install -g turbo@${TURBO_VERSION}

FROM base AS pruner
ARG SERVICE
RUN test -n "$SERVICE"
COPY . .
RUN turbo prune "$SERVICE" --docker

FROM base AS builder
ARG SERVICE
ARG SERVICE_DIR
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN mkdir -p tools/scripts/setup
COPY --from=pruner /app/tools/scripts/setup/rm-rf.mjs tools/scripts/setup/rm-rf.mjs
RUN --mount=type=cache,id=turbo-cache,target=/app/.turbo \
  pnpm exec turbo run build --filter="${SERVICE}..."
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm --filter="${SERVICE}" deploy --prod --legacy /prod
COPY services/api-gateway/docker-assets /tmp/api-gateway-docker-assets
RUN mkdir -p /prod/dist \
  && if [ "$SERVICE" = "@pine/api-gateway" ]; then \
    cp -a /tmp/api-gateway-docker-assets/. /prod/dist/; \
    test -s /prod/dist/supergraph.graphql; \
    test -s /prod/dist/platform.openapi.json; \
  fi

FROM node:${NODE_VERSION}-alpine AS runtime
ARG TSX_VERSION
ARG SERVICE_DIR
RUN test -n "$SERVICE_DIR"
RUN npm install -g tsx@${TSX_VERSION} --allow-scripts=esbuild
COPY --from=builder --chown=node:node /prod /app
ENV NODE_ENV=production
USER node
WORKDIR /app
CMD ["node", "--import", "/usr/local/lib/node_modules/tsx/dist/loader.mjs", "src/main.ts"]
