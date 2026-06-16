import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload, JwtRequestUser } from './types';

interface AuthorizationHeaderRequest {
  headers?: Record<string, string | string[] | undefined>;
}

function extractBearerToken(request: AuthorizationHeaderRequest): string | null {
  const headerValue = request.headers?.authorization ?? request.headers?.Authorization;
  const authorization = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (!authorization) {
    return null;
  }

  const [scheme, token, ...extraParts] = authorization.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || !token || extraParts.length > 0) {
    return null;
  }

  return token;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromExtractors([extractBearerToken]),
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET')
    });
  }

  validate(payload: JwtPayload): JwtRequestUser {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    return {
      email: payload.email,
      id: payload.sub,
      mobile: payload.mobile,
      permissions: payload.permissions ?? [],
      roles: payload.roles ?? []
    };
  }
}
