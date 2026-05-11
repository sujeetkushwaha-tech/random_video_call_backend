import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { SyncUserDto } from './dto/sync-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*
    ======================
    SIGNUP
    ======================
  */
  @Post('signup')
  @HttpCode(201)
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  /*
    ======================
    LOGIN (EMAIL/PASSWORD)
    ======================
  */
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /*
    ======================
    OAUTH SYNC USER
    ======================
  */
  @Post('sync-user')
  @HttpCode(200)
  async syncUser(@Body() syncUserDto: SyncUserDto) {
    return this.authService.syncUser(syncUserDto);
  }

  /*
    ======================
    LOGOUT (OPTIONAL)
    ======================
  */
  @Post('logout')
  @HttpCode(200)
  async logout() {
    return this.authService.logout();
  }
}