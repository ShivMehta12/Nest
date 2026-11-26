import {
  Module,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
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

    // ───── MongoDB (via Mongoose) ─────
    // Handles: Chat, Notifications — flexible document data
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

    // ───── Feature Modules ─────
    // PostgreSQL modules (TypeORM)
    UsersModule,
    ProductsModule,
    AuthModule,

    // MongoDB modules (Mongoose)
    NotificationsModule,
    ChatModule,
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
