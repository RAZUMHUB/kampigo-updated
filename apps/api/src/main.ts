import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdMiddleware } from './common/interceptors/request-id.middleware';

async function bootstrap() {
  // rawBody: true is required so the Razorpay webhook handler can verify the
  // HMAC signature against the exact raw bytes Razorpay signed.
  const app = await NestFactory.create(AppModule, { cors: false, rawBody: true });

  app.use(helmet());
  app.use(new RequestIdMiddleware().use);

  app.enableCors({
    origin: (process.env.CORS_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Validation failed',
          errors: errors.map((e) => ({
            field: e.property,
            errors: Object.values(e.constraints ?? {}),
          })),
        }),
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on :${port}`);
}

bootstrap();
