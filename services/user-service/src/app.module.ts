import {
  AuditLoggerService,
  HealthCheckService,
  JwtAuthGuard,
  JwtStrategy,
  RbacGuard
} from '@aahar/auth';
import {
  getServiceEnvFilePaths,
  shouldUseRootEnvFileOnly,
  validateServiceEnvWithPort
} from '@aahar/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: getServiceEnvFilePaths(),
      expandVariables: true,
      ignoreEnvVars: shouldUseRootEnvFileOnly(),
      isGlobal: true,
      skipProcessEnv: shouldUseRootEnvFileOnly(),
      validate: (config) => validateServiceEnvWithPort(config, 'USER_SERVICE_PORT', 4002)
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PermissionsModule,
    RolesModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          limit: config.get<number>('THROTTLE_LIMIT') ?? 100,
          ttl: config.get<number>('THROTTLE_TTL') ?? 60000
        }
      ]
    }),
    UsersModule
  ],
  providers: [
    AuditLoggerService,
    HealthCheckService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard
    }
  ]
})
export class AppModule {}
