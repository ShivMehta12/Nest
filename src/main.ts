//**
//The entry file of the application which uses the core function NestFactory to create a Nest application instance.

/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// import { AuthMiddleware } from './common/middleware/auth.middleware';
async function startNest() {
  const app = await NestFactory.create(AppModule, {logger:false});
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // remove fields not in DTO
    forbidNonWhitelisted: true,  // throw error if extra fields exist
    transform: true,
  }),)
  // app.use(AuthMiddleware)
  await app.listen(process.env.PORT ?? 3000);
}
startNest();
