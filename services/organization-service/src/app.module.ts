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
import { CountersModule } from './counters/counters.module';
import { HealthController } from './health.controller';
import { HospitalsModule } from './hospitals/hospitals.module';
import { KitchensModule } from './kitchens/kitchens.module';
import { LocationsModule } from './locations/locations.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { StoresModule } from './stores/stores.module';

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
      validate: (config) => validateServiceEnvWithPort(config, 'ORGANIZATION_SERVICE_PORT', 4003)
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
    CountersModule,
    HospitalsModule,
    KitchensModule,
    LocationsModule,
    RestaurantsModule,
    StoresModule
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
