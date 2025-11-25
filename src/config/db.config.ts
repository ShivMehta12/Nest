
import { ConfigService } from '@nestjs/config';
import {TypeOrmModule, TypeOrmModuleOptions} from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory : (ConfigService: ConfigService)  => ({
                type: 'postgres',
                host: ConfigService.getOrThrow<string>('DB_HOST'),
                port: +ConfigService.getOrThrow<number>('DB_PORT'),
                username: ConfigService.getOrThrow<string>('DB_USER'),
                password: ConfigService.getOrThrow<string>('DB_PASSWORD'),
                database: ConfigService.getOrThrow<string>('DB_NAME'),
                // entities: [__dirname + '/../**/*.entity{.ts,.js}'],
                synchronize: true,
                autoLoadEntities: true,
            }),
            inject: [ConfigService],
        })
    ],
})
export class dbConfig {}