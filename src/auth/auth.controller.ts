import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }

  @Post('logout')
  logout(@Request() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    this.authService.logout(token);
    return {};
  }

  @Get('me')
  getMe(@Request() req: any) {
    return this.authService.getMe(req.user);
  }

  @Public()
  @Post('set-password')
  setPassword(@Body() body: { userId: number; password: string }) {
    return this.authService.setPassword(body.userId, body.password);
  }
}
