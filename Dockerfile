# syntax=docker/dockerfile:1

ARG NODE_VERSION=21.6.1
ARG PNPM_VERSION=9.0.4

# Stage 1: Setup base
FROM node:${NODE_VERSION}-alpine AS base

RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

WORKDIR /usr/src/app

COPY . .


# Stage 2: Install dependencies and build with Turbo (task graph + cache-friendly)
FROM base AS build

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Build all server packages/services once; individual runtime stages only need their graph outputs.
# Prefer per-service targets below when optimizing layer cache further.
RUN pnpm exec turbo run build \
    --filter=@pine/attachment-service \
    --filter=@pine/notification-service \
    --filter=@pine/identity-service \
    --filter=@pine/platform-service \
    --filter=@pine/authorization-service \
    --filter=@pine/items-service \
    --filter=@pine/common \
    --filter=@pine/events \
    --filter=@pine/security \
    --filter=@pine/http \
    --filter=@pine/graphql-core


# Stage 3: Attachment Service
FROM base AS attachment
COPY --from=build /usr/src/app /usr/src/app
USER node
EXPOSE 4000
CMD pnpm -F @pine/attachment-service start


# Stage 3: Notification Service
FROM base AS notification-service
COPY --from=build /usr/src/app /usr/src/app
USER node
EXPOSE 4000
CMD pnpm -F @pine/notification-service start


# Stage 3: Identity Service
FROM base AS identity-service
COPY --from=build /usr/src/app /usr/src/app
USER node
EXPOSE 4000
CMD pnpm -F @pine/identity-service start


# Stage 3: Platform Service
FROM base AS platform-service
COPY --from=build /usr/src/app /usr/src/app
USER node
EXPOSE 4000
CMD pnpm -F @pine/platform-service start


# Stage 3: Authorization Service
FROM base AS authorization-service
COPY --from=build /usr/src/app /usr/src/app
USER node
EXPOSE 4000
CMD pnpm -F @pine/authorization-service start


# Stage 3: Items Service
FROM base AS items-service
COPY --from=build /usr/src/app /usr/src/app
USER node
EXPOSE 4000
CMD pnpm -F @pine/items-service start
