import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigModule

console.log(process.env.SECRET_KEY, 'process.env.SECRET_KEY');
@Module({
  imports: [
    ConfigModule, // Import ConfigModule to enable access to environment variables
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], // Ensure ConfigModule is imported here
      inject: [ConfigService], // Inject ConfigService
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('SECRET_KEY'), // Access SECRET_KEY from ConfigService
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
