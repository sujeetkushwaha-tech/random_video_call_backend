import { NestFactory } from '@nestjs/core';

import { ValidationPipe, VersioningType } from '@nestjs/common';

import helmet from 'helmet';

import cookieParser from 'cookie-parser';

import compression from 'compression';

import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /*
    CONFIG SERVICE
  */
  const configService = app.get(ConfigService);

  /*
    ENV VALUES
  */
  const PORT = configService.get<number>('PORT') || 5000;

  /*
    MULTIPLE FRONTEND URLS
  */
  const FRONTEND_URLS =
    configService
      .get<string>('FRONTEND_URL')
      ?.split(',')
      .map((url) => url.trim()) || [];

  const API_PREFIX = configService.get<string>('API_PREFIX') || 'api';

  const API_VERSION = configService.get<string>('API_VERSION') || '1';

  /*
    SECURITY HEADERS
  */
  app.use(helmet());

  /*
    ENABLE COMPRESSION
  */
  app.use(compression());

  /*
    COOKIE PARSER
  */
  app.use(cookieParser());

  /*
    GLOBAL PREFIX
  */
  app.setGlobalPrefix(API_PREFIX);

  /*
    API VERSIONING
  */
  app.enableVersioning({
    type: VersioningType.URI,

    defaultVersion: API_VERSION,
  });

  /*
    GLOBAL VALIDATION
  */
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

  /*
    CORS
  */
  app.enableCors({
    origin: (origin, callback) => {
      /*
        ALLOW POSTMAN / MOBILE APPS
      */
      if (!origin) {
        return callback(null, true);
      }

      /*
        CHECK WHITELIST
      */
      if (FRONTEND_URLS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalFilters(new HttpExceptionFilter());

  /*
    GRACEFUL SHUTDOWN
  */
  app.enableShutdownHooks();

  /*
    START SERVER
  */
  await app.listen(PORT);

  console.log(`
    Server running on:
    http://localhost:${PORT}/${API_PREFIX}/v${API_VERSION}
  `);

  // console.log(
  //   'Allowed Origins:',
  //   FRONTEND_URLS,
  // );
}

bootstrap();
