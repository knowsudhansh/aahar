import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AuthAuditLogService } from '../common/audit/auth-audit-log.service';
import { PrismaService } from '../common/prisma/prisma.service';
import type { AuthContext, AuthTokens } from './auth.types';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';

const authUserInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            },
            where: {
              deletedAt: null
            }
          }
        }
      }
    },
    where: {
      deletedAt: null
    }
  }
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly auditLog: AuthAuditLogService,
    private readonly otp: OtpService,
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const target = await this.otp.send(dto);

    return {
      channel: target.channel
    };
  }

  async verifyOtp(dto: VerifyOtpDto, context: AuthContext): Promise<AuthTokens> {
    const target = await this.otp.verify(dto);
    const user = await this.findLoginUser(target);
    const tokens = await this.tokens.issueTokens(this.toTokenUser(user));

    await this.auditLog.record({
      action: 'AUTH_LOGIN',
      entityId: user.id,
      ipAddress: context.ipAddress,
      newValue: {
        channel: target.channel
      },
      userId: user.id
    });

    return tokens;
  }

  async refresh(dto: RefreshTokenDto, context: AuthContext): Promise<AuthTokens> {
    const payload = await this.tokens.verifyRefreshToken(dto.refreshToken);
    const user = await this.findUserById(payload.sub);

    await this.tokens.revokeRefreshToken(payload.jti);

    const tokens = await this.tokens.issueTokens(this.toTokenUser(user));

    await this.auditLog.record({
      action: 'AUTH_REFRESH',
      entityId: user.id,
      ipAddress: context.ipAddress,
      userId: user.id
    });

    return tokens;
  }

  async logout(dto: LogoutDto, context: AuthContext) {
    const payload = await this.tokens.verifyRefreshToken(dto.refreshToken);

    await this.tokens.revokeRefreshToken(payload.jti);
    await this.auditLog.record({
      action: 'AUTH_LOGOUT',
      entityId: payload.sub,
      ipAddress: context.ipAddress,
      userId: payload.sub
    });

    return {
      loggedOut: true
    };
  }

  private async findLoginUser(target: { channel: 'email' | 'mobile'; value: string }) {
    const user = await this.prisma.user.findFirst({
      include: authUserInclude,
      where: {
        deletedAt: null,
        status: UserStatus.ACTIVE,
        ...(target.channel === 'mobile'
          ? {
              mobile: target.value
            }
          : {
              email: target.value
            })
      }
    });

    if (!user) {
      throw new UnauthorizedException('User is not registered or active');
    }

    return user;
  }

  private async findUserById(id: string) {
    const user = await this.prisma.user.findFirst({
      include: authUserInclude,
      where: {
        deletedAt: null,
        id,
        status: UserStatus.ACTIVE
      }
    });

    if (!user) {
      throw new UnauthorizedException('User is not registered or active');
    }

    return user;
  }

  private toTokenUser(user: Awaited<ReturnType<AuthService['findUserById']>>) {
    const roles = user.roles.map((userRole) => userRole.role.name);
    const permissions = [
      ...new Set(
        user.roles.flatMap((userRole) =>
          userRole.role.permissions
            .filter((rolePermission) => rolePermission.permission.deletedAt === null)
            .map((rolePermission) => rolePermission.permission.code),
        ),
      )
    ];

    return {
      email: user.email,
      id: user.id,
      mobile: user.mobile,
      permissions,
      roles
    };
  }
}
