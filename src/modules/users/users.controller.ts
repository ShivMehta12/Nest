import { Body, Controller, Get, HttpCode, Param, Post, Query, Redirect, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
// import type { Request } from 'express';
import { CreateUserDto } from './users.dto';
import { Req } from '@nestjs/common';
import { response } from 'src/utils/response';


/**
 * which ever start from @ it is known as decorator
 * to create crud use nest g resource [name]
 * to create only controller use nest g controller [name]
 */
@Controller('users')
export class UsersController {
  constructor(private readonly userService:UsersService) {}         



  @Get('all')
  async findAllUsers(@Query() query:any, @Req() req) {
    console.log(req.identity,"req.identty");       // ← access identity here
    const data =await  this.userService.getAllUsers(query)
    return data
  }

  // @UseGuards(AuthGuard)
  @Get("/:id") // for getting all users
  async findOneUser(@Query('id') id:string) {
    
    const data = await this.userService.getUser(id)
    return data
  }

  // add user
  @Post("add-user")
  async addUser(@Body() body:any, @Req() req) {
    try {
      console.log(req.identity,"req.identty");       // ← access identity here
      const data = await this.userService.addUser(body, req.identity.id)
      
    } catch (error:any) {
      return response.failed(error, "")
    }
  }

}


