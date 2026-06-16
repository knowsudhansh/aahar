import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { correlationIdMiddleware } from './correlation-id.middleware';
import { GlobalExceptionFilter } from './global-exception.filter';
import { requestLoggingMiddleware } from './request-logging.middleware';

export interface SecurityBaselineOptions {
  swaggerDescription: string;
  swaggerTitle: string;
  serviceName: string;
}

const localDevelopmentCorsOrigins = [
  'http://localhost:3000',
  'http://localhost:4001',
  'http://localhost:4002',
  'http://localhost:4003'
];

function parseAllowedOrigins(config: ConfigService): string[] {
  const configuredOrigins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (config.get<string>('NODE_ENV') !== 'development') {
    return configuredOrigins;
  }

  return [...new Set([...configuredOrigins, ...localDevelopmentCorsOrigins])];
}

export function configureSecurityBaseline(
  app: INestApplication,
  config: ConfigService,
  options: SecurityBaselineOptions,
): void {
  const allowedOrigins = parseAllowedOrigins(config);

  app.use(
    helmet({
      contentSecurityPolicy: config.get<string>('NODE_ENV') === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
      hsts: {
        includeSubDomains: true,
        maxAge: 15_552_000
      }
    }),
  );
  app.enableCors({
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'), false);
    }
  });
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware(options.serviceName));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(options.swaggerTitle)
    .setDescription(options.swaggerDescription)
    .setVersion('1.0')
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        scheme: 'bearer',
        type: 'http'
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);
}
