import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from '../src/app.module';

const server = express();

let app: any;

async function createApp(): Promise<void> {
  if (app) return;

  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    {
      logger: ['log', 'warn', 'error'],
    },
  );

  const configService = nestApp.get(ConfigService);
  const logger = new Logger('VercelBootstrap');

  const requiredVars: [string, string][] = [
    ['jwt.secret', 'JWT_SECRET'],
    ['jwt.refreshSecret', 'JWT_REFRESH_SECRET'],
    ['DATABASE_URL', 'DATABASE_URL'],
  ];
  const missing = requiredVars.filter(([, envVar]) => !process.env[envVar]);
  if (missing.length > 0) {
    logger.error(`Variables de entorno requeridas no configuradas: ${missing.map(([, v]) => v).join(', ')}`);
  }

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

  logger.log('NestJS app initialized for Vercel');
}

export default async function handler(req: any, res: any) {
  await createApp();
  server(req, res);
}
