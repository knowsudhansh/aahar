import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

const serviceEnvSchema = z.object({
  CORS_ORIGINS: z
    .string()
    .default(
      'http://localhost:3000,http://127.0.0.1:3000,http://172.25.208.1:3000,http://172.29.132.245:3000,http://localhost:4001,http://localhost:4002,http://localhost:4003',
    ),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TOKEN_TTL: z.string().default('30m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_TOKEN_TTL: z.string().default('7d'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  PORT: z.coerce.number().int().min(1).max(65535),
  REDIS_URL: z.string().url(),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  THROTTLE_TTL: z.coerce.number().int().positive().default(60000)
});

export type ServiceEnv = z.infer<typeof serviceEnvSchema>;

function findWorkspaceRoot(startDirectory: string): string {
  let currentDirectory = path.resolve(startDirectory);

  while (true) {
    if (fs.existsSync(path.join(currentDirectory, 'pnpm-workspace.yaml'))) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return path.resolve(startDirectory);
    }

    currentDirectory = parentDirectory;
  }
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)];
}

export function getServiceEnvFilePaths(): string[] {
  const cwd = process.cwd();
  const workspaceRoot = findWorkspaceRoot(cwd);

  return uniquePaths([
    path.resolve(workspaceRoot, '.env.local'),
    path.resolve(workspaceRoot, '.env'),
    path.resolve(cwd, '.env.local'),
    path.resolve(cwd, '.env')
  ]);
}

export function shouldUseRootEnvFileOnly(): boolean {
  return process.env.npm_lifecycle_event === 'dev';
}

export function validateServiceEnv(config: Record<string, unknown>): ServiceEnv {
  const parsed = serviceEnvSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid service environment configuration. ${details}`);
  }

  return parsed.data;
}

export function validateServiceEnvWithPort(
  config: Record<string, unknown>,
  portKey: string,
  defaultPort: number,
): ServiceEnv {
  return validateServiceEnv({
    ...config,
    PORT: config.PORT ?? config[portKey] ?? defaultPort
  });
}
