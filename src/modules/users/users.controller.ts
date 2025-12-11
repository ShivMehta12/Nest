import { Body, Controller, Get, HttpCode, Param, Post, Query, Redirect, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
// import type { Request } from 'express';
import { CreateUserDto } from './users.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Req } from '@nestjs/common';


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
    return {message:"login successful",data}
  }


  @Get('all')
  async findAllUsers(@Query() query:any, @Req() req) {
    console.log(req.identity,"req.identty");       // ← access identity here
    const data =await  this.userService.getAllUsers(query)
    return data
  }

  // @UseGuards(AuthGuard)
  @Get("/:id") // for getting all users
  async findOneUser(@Query('id') id:string) {
    console.log(id,'==id');
    const data = await this.userService.getUser(id)
    return data
  }

  // @UseGuards(AuthGuard)
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return this.userService.getUser(req.user);
  // }
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


