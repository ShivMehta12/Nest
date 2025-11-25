//**
//The entry file of the application which uses the core function NestFactory to create a Nest application instance.

/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
console.log('in main.ts file========');
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // remove fields not in DTO
    forbidNonWhitelisted: true,  // throw error if extra fields exist
    transform: true,
  }),)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
