import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Users} from './users.entity'; // <--- **IMPORT THE ENTITY HERE**
import { Products } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Products]), // <--- **REGISTER THE ENTITY HERE**
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService,TypeOrmModule], // Export UsersService to make it available in other modules
})
export class UsersModule {
}
