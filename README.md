# AAHAR

AAHAR is a production-ready monorepo scaffold for the admin web app, backend services, shared packages, PostgreSQL, Redis, Prisma, and Docker infrastructure.

Business logic is intentionally not implemented yet. This repository establishes structure, tooling, package boundaries, and runtime configuration.

## Stack

- Next.js 15
- TypeScript
- NestJS
- PostgreSQL
- Prisma
- Redis
- Turborepo
- pnpm workspaces

## Repository Structure

```txt
apps/
  admin-portal/
services/
  auth-service/
  user-service/
  organization-service/
packages/
  ui/
  types/
  api-client/
  auth/
  config/
infra/
  docker/
  scripts/
  postgres/
  redis/
prisma/
```

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker and Docker Compose

Enable pnpm through Corepack:

```bash
corepack enable
```

## Setup

Install dependencies:

```bash
pnpm install
```

Create local environment files:

```bash
cp .env.example .env
cp apps/admin-portal/.env.example apps/admin-portal/.env
cp services/auth-service/.env.example services/auth-service/.env
cp services/user-service/.env.example services/user-service/.env
cp services/organization-service/.env.example services/organization-service/.env
```

Generate Prisma clients:

```bash
pnpm db:generate
```

Run Sprint 1 migrations and seed foundation roles/permissions:

```bash
pnpm db:migrate --name sprint_1_foundation
pnpm db:seed
```

## Development

Run all workspaces through Turborepo:

```bash
pnpm dev
```

Run one workspace:

```bash
pnpm --filter @aahar/admin-portal dev
pnpm --filter @aahar/auth-service dev
pnpm --filter @aahar/user-service dev
pnpm --filter @aahar/organization-service dev
```

Default local ports:

- Admin Portal: `3000`
- Auth Service: `4001`
- User Service: `4002`
- Organization Service: `4003`
- PostgreSQL: `5432`
- Redis: `6379`
- Swagger docs:
  - Auth Service: `http://localhost:4001/api/v1/docs`
  - User Service: `http://localhost:4002/api/v1/docs`
  - Organization Service: `http://localhost:4003/api/v1/docs`

## Quality Gates

```bash
pnpm lint
pnpm typecheck
pnpm format:check
pnpm build
```

Husky runs `lint-staged` before commits and Commitlint validates commit messages using Conventional Commits.

## Docker

Start PostgreSQL, Redis, the three NestJS services, and the Next.js admin portal:

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

Stop the stack:

```bash
docker compose -f infra/docker/docker-compose.yml down
```

Remove local database and Redis volumes:

```bash
docker compose -f infra/docker/docker-compose.yml down -v
```

## Environment Configuration

Root `.env.example` contains shared defaults for Docker Compose and local development. Each app and service also has its own `.env.example` so deployment-specific configuration can stay close to the runtime that consumes it.

The canonical Prisma schema lives at `prisma/schema.prisma`. It contains the Sprint 1 foundation tables for identity, organization, and audit logging. Service-level Prisma placeholder schemas were removed to avoid divergent database definitions.

## Notes

- NestJS services boot with global config, validation, Swagger, JWT validation, RBAC guards, throttling, and a global `/api/v1` prefix.
- Shared packages are intentionally minimal and ready for future domain types, reusable UI, auth utilities, environment config, and API clients.
- Business controllers and workflows are intentionally not implemented in this foundation pass.
