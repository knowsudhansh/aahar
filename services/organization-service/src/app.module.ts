import {
  AuditLoggerService,
  HealthCheckService,
  JwtAuthGuard,
  JwtStrategy,
  RbacGuard,
} from '@aahar/auth';
import {
  getServiceEnvFilePaths,
  shouldUseRootEnvFileOnly,
  validateServiceEnvWithPort,
} from '@aahar/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CountersModule } from './counters/counters.module';
import { EmployeesModule } from './employees/employees.module';
import { GrnsModule } from './grns/grns.module';
import { HealthController } from './health.controller';
import { HospitalsModule } from './hospitals/hospitals.module';
import { ItemCategoriesModule } from './item-categories/item-categories.module';
import { ItemsModule } from './items/items.module';
import { KitchenItemsModule } from './kitchen-items/kitchen-items.module';
import { KitchenProductionsModule } from './kitchen-productions/kitchen-productions.module';
import { KitchensModule } from './kitchens/kitchens.module';
import { LocationsModule } from './locations/locations.module';
import { PaymentMachinesModule } from './payment-machines/payment-machines.module';
import { PosDevicesModule } from './pos-devices/pos-devices.module';
import { RestaurantMenusModule } from './restaurant-menus/restaurant-menus.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { StockModule } from './stock/stock.module';
import { StoreItemsModule } from './store-items/store-items.module';
import { StoresModule } from './stores/stores.module';
import { TimeSlotsModule } from './time-slots/time-slots.module';
import { TransferAcknowledgementsModule } from './transfer-acknowledgements/transfer-acknowledgements.module';
import { TransfersModule } from './transfers/transfers.module';

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
      validate: (config) => validateServiceEnvWithPort(config, 'ORGANIZATION_SERVICE_PORT', 4003),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          limit: config.get<number>('THROTTLE_LIMIT') ?? 100,
          ttl: config.get<number>('THROTTLE_TTL') ?? 60000,
        },
      ],
    }),
    CountersModule,
    EmployeesModule,
    GrnsModule,
    HospitalsModule,
    ItemCategoriesModule,
    ItemsModule,
    KitchenItemsModule,
    KitchenProductionsModule,
    KitchensModule,
    LocationsModule,
    PaymentMachinesModule,
    PosDevicesModule,
    RestaurantMenusModule,
    RestaurantsModule,
    StockModule,
    StoreItemsModule,
    StoresModule,
    TimeSlotsModule,
    TransferAcknowledgementsModule,
    TransfersModule,
  ],
  providers: [
    AuditLoggerService,
    HealthCheckService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
  ],
})
export class AppModule {}
