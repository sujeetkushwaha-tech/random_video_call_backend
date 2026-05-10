import { Controller, Post, Body, Req, UseGuards, HttpCode } from '@nestjs/common';

import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SyncUserDto } from './dto/sync-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*
    ======================
    SIGNUP → CREATE USER
    ======================
  */
  @Post('signup')
  @HttpCode(201)
  async signup(@Body() signupDto: SignupDto) {
    return await this.authService.signup(signupDto);
  }

  /*
    ======================
    LOGIN → AUTH USER
    ======================
  */
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  /*
    ======================
    SYNC USER (OAUTH)
    ======================
  */
  @Post('sync-user')
  @HttpCode(200)
  async syncUser(@Body() syncUserDto: SyncUserDto) {
    return await this.authService.syncUser(syncUserDto);
  }

  /*
    ======================
    REFRESH TOKEN
    ======================
  */
  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ) {
    return await this.authService.refreshToken(refreshToken);
  }

  /*
    ======================
    LOGOUT
    ======================
  */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: any) {
    return await this.authService.logout(req.user.userId);
  }
}