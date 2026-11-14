import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  });
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Knosis backend running on http://localhost:${port}`);
}

void bootstrap();
