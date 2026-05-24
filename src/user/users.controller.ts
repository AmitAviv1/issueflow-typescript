import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':userId/mentions')
  getMentions(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.usersService.getMentions(
      Number(userId),
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
    );
  }

  @Get(':userId')
  findOne(@Param('userId') userId: string): Promise<User | null> {
    return this.usersService.findOne(Number(userId));
  }

  // Registration is public — it is the bootstrap for obtaining a JWT.
  @Public()
  @Post()
  create(@Body() body: CreateUserDto): Promise<User> {
    return this.usersService.create(body);
  }

  @Post('update/:userId')
  update(
    @Param('userId') userId: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.usersService.update(Number(userId), body, user.id);
  }

  @Delete(':userId')
  remove(@Param('userId') userId: string, @CurrentUser() user: AuthUser): Promise<void> {
    return this.usersService.remove(Number(userId), user.id);
  }
}
