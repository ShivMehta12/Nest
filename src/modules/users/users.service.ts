import { Injectable } from '@nestjs/common';
import { Users } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './users.dto';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import {response} from '../../utils/response';
import {constants} from '../../utils/constants';
const {SECRET_KEY} = process.env;


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) { }
  async createUser(dto: CreateUserDto) {
    const emailExist = await this.usersRepository.findOne({where:{email:dto.email}});
    if (emailExist) {
      throw new BadRequestException('Email already exists');
    }
    dto.password = await bcrypt.hash(dto.password, 10);
    const newUser = this.usersRepository.create(dto);
    return await this.usersRepository.save(newUser);
  }

  async loginUser(dto: any) {
    const get_user = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (!get_user) {
      throw new BadRequestException('Invalid email');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, get_user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    const token = jwt.sign({ id: get_user.id, email: get_user.email }, process.env.SECRET_KEY, { expiresIn: '1h' });
    
    console.log(token,'=================');
    return response.success({token}, constants.USERS.LOGIN);
  }

  async getAllUsers(query: any) {
    const { page = 1, limit = 10, sortBy = 'id', order = 'ASC', ...filters } = query;

    return await this.usersRepository.find({
      where: filters,
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getUser(id:any) {
    console.log(id,'==service id');
    return await this.usersRepository.findOneBy({id});
  }
  
  async getUserByEmail(email:string) {
    return await this.usersRepository.findOne({ where: { email } });
  }

}
