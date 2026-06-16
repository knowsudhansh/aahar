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

ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm --filter "@aahar/admin-portal..." build

FROM base AS runner

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/admin-portal/.next/standalone ./
COPY --from=builder /app/apps/admin-portal/.next/static ./apps/admin-portal/.next/static
COPY --from=builder /app/apps/admin-portal/public ./apps/admin-portal/public

EXPOSE 3000

CMD ["node", "apps/admin-portal/server.js"]
