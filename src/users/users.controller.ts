import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  createUser(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.usersService.login(body.username, body.password);
  }
  @Post('startsession')
  async startsession(@Body() body: { jwtToken: string }) {
    const payload = await this.jwtService.verifyAsync<{ id: number }>(
      body.jwtToken,
    );

    if (!payload?.id) {
      throw new UnauthorizedException('invalid token');
    }

    return this.usersService.startSession(payload.id);
  }
}
