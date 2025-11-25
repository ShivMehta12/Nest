// This is the root module of the application
import { Module } from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import { ConfigModule,ConfigService } from '@nestjs/config';
import { dbConfig } from './config/db.config';

import { UsersModule } from './modules/users/users.module';
import { Users } from './modules/users/users.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    dbConfig,ConfigModule,
    UsersModule,
    AuthModule, // Import the AuthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
