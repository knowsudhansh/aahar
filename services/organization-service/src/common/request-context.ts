import type { JwtRequestUser } from '@aahar/auth';

export interface ActorContext {
  actorId?: string;
  hospitalId?: string;
  ipAddress?: string;
}

export interface RequestContextLike {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}

export function getActorId(user?: JwtRequestUser): string | undefined {
  return user?.id;
}

export function getIpAddress(request: RequestContextLike): string | undefined {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0];
  }

  return forwardedFor?.split(',')[0]?.trim() || request.ip;
}
