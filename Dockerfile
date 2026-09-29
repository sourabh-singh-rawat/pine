# syntax=docker/dockerfile:1

ARG NODE_VERSION=26.10.0
ARG PNPM_VERSION=12.6.0
ARG TURBO_VERSION=2.10.9
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
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN mkdir -p tools/scripts/setup
COPY --from=pruner /app/tools/scripts/setup/rm-rf.mjs tools/scripts/setup/rm-rf.mjs
RUN pnpm exec turbo run build --filter="${SERVICE}..."

FROM pnpm AS runtime
ARG SERVICE_DIR
RUN test -n "$SERVICE_DIR"
COPY --from=builder --chown=node:node /app /app
ENV NODE_ENV=production
USER node
WORKDIR /app/${SERVICE_DIR}
CMD ["node", "--import", "tsx", "src/main.ts"]
