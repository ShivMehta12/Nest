import {
  Module,
  NestModule,
  MiddlewareConsumer,
  Logger,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import * as dotenv from 'dotenv';

import { DbConfigModule } from './config/db.config';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ChatModule } from './modules/chat/chat.module';
import { Users } from './modules/users/users.entity';

import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { ReqDecryptMiddleware } from './common/middleware/req-decrypt.middleware';
import { ReqResInterceptor } from './common/interceptors/reqRes';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

// Pre-load .env so configuration is available at module definition time
dotenv.config();

// MongoDB is enabled by default unless explicitly set to 'false'
const isMongoEnabled = process.env.ENABLE_MONGODB !== 'false';

const mongoModules = isMongoEnabled
  ? [
      MongooseModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          uri: config.get<string>(
            'MONGODB_URL',
            'mongodb://localhost:27017/learning-nestjs',
          ),
        }),
        inject: [ConfigService],
      }),
      NotificationsModule,
      ChatModule,
    ]
  : [];

const logger = new Logger('AppModule');
if (isMongoEnabled) {
  logger.log('MongoDB enabled: Mongoose, Chat (WebSockets + REST), and Notifications modules active.');
} else {
  logger.log('MongoDB disabled: set ENABLE_MONGODB=true to enable.');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(
          'JWT_SECRET',
          'super_secret_nest_jwt_key_2026_change_in_production',
        ),
        signOptions: {
          expiresIn: (config.get('JWT_EXPIRES_IN', '1d') as any),
        },
      }),
      inject: [ConfigService],
    }),

    // ───── PostgreSQL (via TypeORM) ─────
    // Handles: Users, Products, Auth — structured relational data
    DbConfigModule,
    TypeOrmModule.forFeature([Users]),

    // ───── PostgreSQL Feature Modules ─────
    UsersModule,
    ProductsModule,
    AuthModule,

    // ───── MongoDB Feature Modules (WebSockets & Document DB) ─────
    // Active when MongoDB is enabled
    ...mongoModules,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ReqResInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, AuthMiddleware, ReqDecryptMiddleware)
      .forRoutes('*');
  }
}
