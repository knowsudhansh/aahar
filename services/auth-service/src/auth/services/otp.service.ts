import { randomInt } from 'node:crypto';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/redis/redis.service';

type OtpChannel = 'email' | 'mobile';

interface OtpTarget {
  channel: OtpChannel;
  value: string;
}

const DEV_OTP = '000000';

@Injectable()
export class OtpService {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  getTarget(input: { email?: string; mobile?: string }): OtpTarget {
    if (input.mobile) {
      return {
        channel: 'mobile',
        value: input.mobile
      };
    }

    if (input.email) {
      return {
        channel: 'email',
        value: input.email.toLowerCase()
      };
    }

    throw new BadRequestException('Mobile number or email is required');
  }

  async send(input: { email?: string; mobile?: string }): Promise<OtpTarget> {
    const target = this.getTarget(input);
    const otp = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const ttlSeconds = this.config.get<number>('OTP_TTL_SECONDS') ?? 300;

    await this.redis.setWithExpiry(this.getOtpKey(target), otp, ttlSeconds);

    if (this.config.get<string>('NODE_ENV') === 'development') {
      console.info(
        JSON.stringify({
          channel: target.channel,
          event: 'auth_otp_generated',
          otp,
          target: target.value
        }),
      );
    }

    return target;
  }

  async verify(input: { email?: string; mobile?: string; otp: string }): Promise<OtpTarget> {
    const target = this.getTarget(input);
    const isDevelopment = this.config.get<string>('NODE_ENV') === 'development';

    if (isDevelopment && input.otp === DEV_OTP) {
      return target;
    }

    const key = this.getOtpKey(target);
    const storedOtp = await this.redis.get(key);

    if (!storedOtp || storedOtp !== input.otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.redis.delete(key);

    return target;
  }

  private getOtpKey(target: OtpTarget): string {
    return `auth:otp:${target.channel}:${target.value}`;
  }
}
