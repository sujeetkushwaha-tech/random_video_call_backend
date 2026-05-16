import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  HttpCode,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { SyncUserDto } from './dto/sync-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*
    ======================
    SIGNUP (PUBLIC)
    ======================
  */
  @Post('signup')
  @Public()
  @HttpCode(201)
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  /*
    ======================
    LOGIN (PUBLIC)
    ======================
  */
  @Post('login')
  @Public()
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /*
    ======================
    GET CURRENT USER (PROTECTED)
    ======================
  */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      return { user: null };
    }
    const user = await this.authService.getMe(userId);
    return { user };
  }

  /*
    ======================
    OAUTH SYNC USER (PUBLIC)
    ======================
  */
  @Post('sync-user')
  @Public()
  @HttpCode(200)
  async syncUser(@Body() syncUserDto: SyncUserDto) {
    return this.authService.syncUser(syncUserDto);
  }

  /*
    ======================
    LOGOUT (PROTECTED)
    ======================
  */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout() {
    return this.authService.logout();
  }
}