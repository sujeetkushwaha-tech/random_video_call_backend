import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  // Log file path will save to the root folder of your NestJS project
  private logFilePath = path.join(process.cwd(), 'app.log');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = request;
    const startTime = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const duration = Date.now() - startTime;
      const timestamp = new Date().toISOString();

      // 1. Determine Log Level type based on HTTP Status Code
      let logLevel = 'INFO';
      if (statusCode >= 400 && statusCode < 500) {
        logLevel = 'WARN';
      } else if (statusCode >= 500) {
        logLevel = 'ERROR';
      }

      // 2. Format the message string for the log file
      const logMessage = `[${timestamp}] [${logLevel}] ${method} ${originalUrl} ${statusCode} - ${duration}ms - IP: ${ip}\n`;

      // 3. Print to your terminal as usual
      if (logLevel === 'ERROR') {
        this.logger.error(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
      } else if (logLevel === 'WARN') {
        this.logger.warn(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
      } else {
        this.logger.log(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
      }

      // 4. Append log message to 'app.log' asynchronously
      fs.appendFile(this.logFilePath, logMessage, (err) => {
        if (err) {
          this.logger.error(`Failed to write to log file: ${err.message}`);
        }
      });
    });

    next();
  }
}