import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { env } from './config/env';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.use(cookieParser());

  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:8080'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Mamboo Kanban API')
    .setDescription('Kanban Operacional — Mamboo')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(env.PORT);
  console.log(`Mamboo API running on http://localhost:${env.PORT}/api/v1`);
  console.log(`Swagger docs at  http://localhost:${env.PORT}/docs`);
}

bootstrap().catch(() => process.exit(1));
