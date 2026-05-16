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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /*
    CONFIG SERVICE
  */
  const configService = app.get(ConfigService);

  /*
    ENV VALUES
  */
  const PORT = configService.get<number>('PORT') || 8000;

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
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

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
    origin: FRONTEND_URLS,

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  /*
    GLOBAL AUTH GUARD (protects ALL routes by default)
    Use @Public() on routes that don't need auth
  */
  app.useGlobalGuards(app.get(JwtAuthGuard));

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalFilters(new HttpExceptionFilter());

  /*
    SOCKET.IO WITH JWT AUTH
  */
  class AuthenticatedIoAdapter extends IoAdapter {
    createIOServer(port: number) {
      const server = super.createIOServer(port, {
        cors: {
          origin: FRONTEND_URLS,
          credentials: true,
        },
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
          const payload = jwtService.verify(token, {
            secret:
              process.env.JWT_ACCESS_SECRET || 'default-secret-change-in-env',
          });

          socket.user = payload;

          next();
        } catch (err) {
          return next(new Error('Authentication error: Invalid token'));
        }
      });

      return server;
    }
  }

  app.useWebSocketAdapter(new AuthenticatedIoAdapter(app));

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
}

bootstrap();
