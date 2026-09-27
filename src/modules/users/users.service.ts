import { Injectable } from '@nestjs/common';
import { Users } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './users.dto';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { response } from '../../utils/response';
const { SECRET_KEY } = process.env;


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly Users: Repository<Users>,
  ) { }
  // async createUser(dto: CreateUserDto) {
  //   const emailExist = await this.Users.findOne({ where: { email: dto.email } });
  //   if (emailExist) {
  //     throw new BadRequestException('Email already exists');
  //   }
  //   dto.password = await bcrypt.hash(dto.password, 10);
  //   const newUser = this.Users.create(dto);
  //   return await this.Users.save(newUser);
  // }

  // async loginUser(dto: any) {
  //   const get_user = await this.Users.findOne({ where: { email: dto.email } });
  //   if (!get_user) {
  //     throw new BadRequestException('Invalid email');
  //   }

  //   const isPasswordValid = await bcrypt.compare(dto.password, get_user.password);
  //   if (!isPasswordValid) {
  //     throw new BadRequestException('Invalid password');
  //   }

  //   const token = jwt.sign({ id: get_user.id, email: get_user.email }, process.env.SECRET_KEY, { expiresIn: '1h' });

  //   console.log(token, '=================');
  //   return response.success({ token }, constants.USERS.LOGIN);
  // }

  async getAllUsers(query: any) {
    const { page = 1, limit = 10, sortBy = 'id', order = 'ASC', ...filters } = query;

    return await this.Users.find({
      where: filters,
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getUser(id: any) {
    console.log(id, '==service id');
    return await this.Users.findOneBy({ id });
  }

  async getUserByEmail(email: string) {
    return await this.Users.findOne({ where: { email } });
  }

  async addUser(dto: any, addedById: number) {
    try {
      const emailExist = await this.Users.findOne({ where: { email: dto.email } });
      if (emailExist) {
        throw new BadRequestException('Email already exists');
      }
      if(dto.password){
        dto.password = await bcrypt.hash(dto.password, 10);
      }else{
        const password = generateRandomPassword(8);
        dto.password = await bcrypt.hash(password, 10);
      }
      const newUser = this.Users.create({ ...dto, addedBy: { id: addedById } });
      await this.Users.save(newUser);
      return response.success({}, 'User added successfully');
      
    } catch (error) {
      return response.failed('Something went wrong', "");
    }
  }

}


const generateRandomPassword = (length: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password;
}