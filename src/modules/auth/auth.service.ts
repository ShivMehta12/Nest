import {Injectable} from '@nestjs/common';
import { Users } from '../users/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {SignUp, login, ResetPassword, ForgetPassword} from './dto/authDto';
import { response } from 'src/utils/response';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
    constructor (@InjectRepository(Users) 
    private readonly users: Repository<Users>, 
    private readonly config: ConfigService) { }

    async signUp(signUpDto:SignUp, Req:{}){
        try{
            const {email, password} = signUpDto;
            const user = await this.users.findOne({where:{email:email}});  
            if(user){
                return response.failed(null, 'User already exists');
            } 
            const hashedPassword = await bcrypt.hash(password, 10);
            Req['password'] = hashedPassword;
            const newUser = await this.users.create(Req); // entity instance
            await this.users.save(newUser); // save to database
            return response.success(newUser, 'User created successfully');
        } catch(error){
            console.log(error);
            return response.failed(null, 'Failed to sign up');
        }
    }

    async login(loginDto:login, Req:{}){
        try{
            const {email, password} = loginDto;
            const user = await this.users.findOne({where:{email:email}});
            if(!user){
                return response.failed(null, 'User not found');
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if(!isPasswordValid){
                return response.failed(null, 'Invalid password');
            }
            const token = jwt.sign({id: user.id, email: user.email}, this.config.getOrThrow('JWT_SECRET'), {expiresIn: '1h'});
            const data = {
                id: user.id,
                token
            }
            return response.success(data, 'Login successful');
        }catch(error){
            return response.failed(null, 'Failed to login');
        }
    }
}