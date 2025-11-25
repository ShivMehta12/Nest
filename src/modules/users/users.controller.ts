import { Body, Controller, Get, HttpCode, Param, Post, Query, Redirect, Req, UsePipes } from '@nestjs/common';
import { UsersService } from './users.service';
import type { Request } from 'express';
import { CreateUserDto } from './users.dto';

/**
 * which ever start from @ it is known as decorator
 * to create crud use nest g resource [name]
 * to create only controller use nest g controller [name]
 */
@Controller('users')
export class UsersController {
  constructor(private readonly userService:UsersService) {}

  @Post("create") // for create user
  @HttpCode(200)
  create(@Body() body:CreateUserDto) {
    // UsersService
    return this.userService.createUser(body)
  }

  @Post("login")
  async login(@Body() body:any) {
    // UsersService
    const data = await this.userService.loginUser(body)
    return {message:"login successful",data:body}
  }


  @Get('all')
  async findAllUsers(@Query() query:any) {
    const data =await  this.userService.getAllUsers(query)
    return data
  }

  @Get("/:id") // for getting all users
  async findOneUser(@Param('id') id:string) {
    console.log(id,'==id');
    const data = await this.userService.getUser(id)
    return data
  }

  // @Get('params') // this is for view usesr
  // findOne(@Query() query:any) {
  //   const {id} = query
  //   console.log(id,'==id');
  //   console.log("Multiple params",query);
  //   return query;
  // }

  // @Delete(":id"){
  //     delete() {
  //         return {}
  //     }
  // }
}


