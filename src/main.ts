import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ['log', 'warn', 'error']
      : ['log', 'debug', 'verbose', 'warn', 'error'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const requiredVars: [string, string][] = [
    ['jwt.secret', 'JWT_SECRET'],
    ['jwt.refreshSecret', 'JWT_REFRESH_SECRET'],
    ['DATABASE_URL', 'DATABASE_URL'],
  ];
  const missing = requiredVars.filter(([, envVar]) => !process.env[envVar]);
  if (missing.length > 0) {
    logger.error(`Variables de entorno requeridas no configuradas: ${missing.map(([, v]) => v).join(', ')}`);
    process.exit(1);
  }

  app.use(helmet());

  app.setGlobalPrefix('api');

  const corsOrigins = configService.get<string[]>('app.corsOrigin') ?? [];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ecopetrol API')
    .setDescription('API de gestión de registros operativos de pozos petroleros')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
