import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception/http-exception.filter';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ======================================================
  // CONFIG
  // ======================================================
  const configService = app.get(ConfigService);

  const PORT = configService.get<number>('PORT') || 8000;
  const API_PREFIX = configService.get<string>('API_PREFIX') || 'api';
  const API_VERSION = configService.get<string>('API_VERSION') || '1';
  const FRONTEND_URLS =
    configService
      .get<string>('FRONTEND_URL')
      ?.split(',')
      .map((url) => url.trim()) || [];

  // ======================================================
  // CORS — must be before everything else
  // ======================================================
  app.enableCors({
    origin: FRONTEND_URLS,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // ======================================================
  // BODY PARSERS
  // ======================================================
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // ======================================================
  // STATIC FILES — /uploads served with cross-origin headers
  // ======================================================
  app.use(
    '/uploads',
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      next();
    },
    express.static(path.join(process.cwd(), 'uploads')),
  );

  // ======================================================
  // HELMET
  // ======================================================
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:', '*'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );

  // ======================================================
  // COMPRESSION + COOKIES
  // ======================================================
  app.use(compression());
  app.use(cookieParser());

  // ======================================================
  // PREFIX + VERSIONING
  // ======================================================
  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_VERSION,
  });

  // ======================================================
  // VALIDATION
  // ======================================================
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

  // ======================================================
  // GUARDS + INTERCEPTORS + FILTERS
  // ======================================================
  app.useGlobalGuards(app.get(JwtAuthGuard));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // ======================================================
  // WEBSOCKET — Socket.IO with JWT auth
  // ======================================================
  class AuthenticatedIoAdapter extends IoAdapter {
    createIOServer(port: number) {
      const server = super.createIOServer(port, {
        cors: { origin: FRONTEND_URLS, credentials: true },
        transports: ['websocket'],
      });

      const jwtService = app.get(JwtService);

      server.use((socket: any, next: (err?: any) => void) => {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        try {
          socket.user = jwtService.verify(token, {
            secret: process.env.JWT_ACCESS_SECRET || 'default-secret-change-in-env',
          });
          next();
        } catch {
          return next(new Error('Authentication error: Invalid token'));
        }
      });

      return server;
    }
  }

  app.useWebSocketAdapter(new AuthenticatedIoAdapter(app));

  // ======================================================
  // SHUTDOWN + START
  // ======================================================
  app.enableShutdownHooks();

  await app.listen(PORT);

  console.log(`Server running on: http://localhost:${PORT}/${API_PREFIX}/v${API_VERSION}`);
}

bootstrap();