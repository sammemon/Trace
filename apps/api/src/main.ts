import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception.filter';

const envCandidates = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')];
const envPath = envCandidates.find((candidate) => existsSync(candidate));
if (envPath) dotenv.config({ path: envPath });

const requiredEnvironment = ['DATABASE_URL', 'DIRECT_URL', 'JWT_ACCESS_SECRET', 'PRIVATE_DATA_KEY', 'STUDENT_ID_HMAC_SECRET'];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
if (missingEnvironment.length > 0) {
  throw new Error(`Missing environment variables: ${missingEnvironment.join(', ')}. Copy .env.example to .env and add your Supabase values.`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({ origin: process.env.ADMIN_ORIGIN ?? 'http://localhost:5173' });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api/v1');
  const swaggerConfig = new DocumentBuilder().setTitle('TRACE API').setDescription('CampusFind university lost-and-found API').setVersion('1.0').build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
