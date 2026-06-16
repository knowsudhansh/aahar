import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

export interface CorrelatedRequest extends Request {
  requestId?: string;
}

function normalizeRequestId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function getRequestId(request: Partial<CorrelatedRequest>): string | undefined {
  return request.requestId ?? normalizeRequestId(request.headers?.[REQUEST_ID_HEADER]);
}

export function correlationIdMiddleware(
  request: CorrelatedRequest,
  response: Response,
  next: NextFunction,
) {
  const requestId = normalizeRequestId(request.headers[REQUEST_ID_HEADER]) ?? randomUUID();

  request.requestId = requestId;
  response.locals.requestId = requestId;
  response.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}
