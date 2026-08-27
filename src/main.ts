import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from './app.module';

const server = express();
let app: any;

async function createApp(): Promise<void> {
  if (app) return;

  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    {
      logger: process.env.NODE_ENV === 'production'
        ? ['log', 'warn', 'error']
        : ['log', 'debug', 'verbose', 'warn', 'error'],
    },
  );

  const configService = nestApp.get(ConfigService);

  nestApp.use(helmet());
  nestApp.setGlobalPrefix('api');

  const corsOrigins = configService.get<string[]>('app.corsOrigin') ?? [];

  nestApp.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  nestApp.useGlobalPipes(
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

  const document = SwaggerModule.createDocument(nestApp, swaggerConfig);
  SwaggerModule.setup('api/docs', nestApp, document);

  await nestApp.init();
  app = nestApp;
}

export default async function handler(req: any, res: any) {
  await createApp();
  server(req, res);
}

async function bootstrap() {
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

  await createApp();

  const configService = app.get(ConfigService);
  const port = configService.get('app.port') ?? 3000;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

if (!process.env.VERCEL) {
  bootstrap();
}
