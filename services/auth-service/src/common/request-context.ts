export interface RequestContextLike {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}

export function getIpAddress(request: RequestContextLike): string | undefined {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0];
  }

  return forwardedFor?.split(',')[0]?.trim() || request.ip;
}
