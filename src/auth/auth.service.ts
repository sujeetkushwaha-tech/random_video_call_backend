import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService, JwtSignOptions } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { SyncUserDto } from './dto/sync-user.dto';
import { MESSAGES } from 'src/common/constants/messages.constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /*
    =========================
    SIGNUP
    =========================
  */
  async signup(signupDto: SignupDto) {
    /*
      CHECK USER
    */
    const existingUser = await this.userService.findByEmail(signupDto.email);

    if (existingUser) {
      throw new BadRequestException(MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    /*
      HASH PASSWORD
    */
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    /*
      CREATE USER
    */
    const user = await this.userService.createUser({
      name: signupDto.name,

      email: signupDto.email,

      password: hashedPassword,
    });

    /*
      GENERATE TOKENS
    */
    const tokens = await this.generateTokens(user.id);

    /*
      SAVE REFRESH TOKEN
    */
    await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

    return this.buildAuthResponse(MESSAGES.AUTH.SIGNUP_SUCCESS, user, tokens);
  }

  /*
    =========================
    LOGIN
    =========================
  */
  async login(loginDto: LoginDto) {
    /*
      FIND USER
    */
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    /*
      OAUTH USER CHECK
    */
    if (!user.password) {
      throw new UnauthorizedException(
        user?.provider
          ? 'Please login using OAuth'
          : MESSAGES.AUTH.INVALID_CREDENTIALS,
      );
    }

    /*
      VERIFY PASSWORD
    */
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    /*
      GENERATE TOKENS
    */
    const tokens = await this.generateTokens(user.id);

    /*
      SAVE REFRESH TOKEN
    */
    await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

    return this.buildAuthResponse(MESSAGES.AUTH.LOGIN_SUCCESS, user, tokens);
  }

  /*
    =========================
    GOOGLE OAUTH LOGIN
    =========================
  */
  async syncUser(syncUserDto: SyncUserDto) {
    /*
      FIND USER
    */
    let user = await this.userService.findByEmail(syncUserDto.email);

    /*
      CREATE USER
    */
    if (!user) {
      user = await this.userService.createUser({
        name: syncUserDto.name,

        email: syncUserDto.email,

        image: syncUserDto.image,

        provider: syncUserDto.provider,

        isEmailVerified: true,
      });
    }

    /*
      SAFETY CHECK
    */
    if (!user) {
      throw new UnauthorizedException(MESSAGES.AUTH.UNAUTHORIZED);
    }

    /*
      GENERATE TOKENS
    */
    const tokens = await this.generateTokens(user.id);

    /*
      SAVE REFRESH TOKEN
    */
    await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

    return this.buildAuthResponse(MESSAGES.AUTH.LOGIN_SUCCESS, user, tokens);
  }

  /*
    =========================
    REFRESH TOKEN
    =========================
  */
  async refreshToken(refreshToken: string) {
    try {
      /*
        VERIFY TOKEN
      */
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      /*
        FIND USER
      */
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException(MESSAGES.AUTH.UNAUTHORIZED);
      }

      /*
        MATCH TOKEN
      */
      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException(MESSAGES.AUTH.INVALID_TOKEN);
      }

      /*
        GENERATE NEW TOKENS
      */
      const tokens = await this.generateTokens(user.id);

      /*
        UPDATE REFRESH TOKEN
      */
      await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        message: MESSAGES.AUTH.TOKEN_REFRESH_SUCCESS,

        data: tokens,
      };
    } catch (error) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_TOKEN);
    }
  }

  /*
    =========================
    LOGOUT
    =========================
  */
  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, '');

    return {
      message: MESSAGES.AUTH.LOGOUT_SUCCESS,
    };
  }

  /*
    =========================
    GENERATE TOKENS
    =========================
  */
  async generateTokens(userId: string) {
    const payload = {
      sub: userId,
    };

    const accessTokenOptions: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),

      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
        '15m') as JwtSignOptions['expiresIn'],
    };

    const refreshTokenOptions: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),

      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
        '7d') as JwtSignOptions['expiresIn'],
    };

    /*
      CREATE TOKENS
    */
    const accessToken = await this.jwtService.signAsync(
      payload,
      accessTokenOptions,
    );

    const refreshToken = await this.jwtService.signAsync(
      payload,
      refreshTokenOptions,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  /*
    =========================
    REUSABLE AUTH RESPONSE
    =========================
  */
  private buildAuthResponse(
    message: string,
    user: any,
    tokens: {
      accessToken: string;
      refreshToken: string;
    },
  ) {
    return {
      message,
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }
}
