FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json eslint.config.mjs ./
COPY apps/admin-portal/package.json apps/admin-portal/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY services/auth-service/package.json services/auth-service/package.json
COPY services/organization-service/package.json services/organization-service/package.json
COPY services/user-service/package.json services/user-service/package.json

RUN pnpm install --frozen-lockfile=false

FROM deps AS builder

ARG SERVICE_NAME
COPY . .
RUN pnpm db:generate && pnpm --filter "${SERVICE_NAME}..." build

FROM base AS runner

ARG SERVICE_PATH
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/${SERVICE_PATH}/dist ./dist
COPY --from=builder /app/${SERVICE_PATH}/package.json ./package.json

CMD ["node", "dist/main.js"]
