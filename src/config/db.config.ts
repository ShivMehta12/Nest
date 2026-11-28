import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DB_TYPE', 'postgres');

        if (dbType === 'mongodb') {
          return {
            type: 'mongodb',
            url: config.get<string>(
              'MONGODB_URL',
              'mongodb://localhost:27017/learning-nestjs',
            ),
            authSource: 'admin',
            synchronize: true,
            autoLoadEntities: true,
          };
        }

        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST', 'localhost'),
          port: Number(config.get<number>('DB_PORT', 5432)),
          username: config.get<string>('DB_USER', 'postgres'),
          password: config.get<string>('DB_PASSWORD', 'postgres'),
          database: config.get<string>('DB_NAME', 'learning-nestjs'),
          synchronize: config.get<string>('NODE_ENV') !== 'production',
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DbConfigModule { }

export { DbConfigModule as dbConfig };
