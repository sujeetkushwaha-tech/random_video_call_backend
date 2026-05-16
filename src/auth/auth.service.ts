import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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
  ) {}

  private generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'default-secret-change-in-env',

      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
    });

    return {
      accessToken,
    };
  }

  // =================================================
  // SIGNUP (CREATE USER ONLY)
  // =================================================
  async signup(signupDto: SignupDto) {
    const existingUser = await this.userService.findByEmail(signupDto.email);

    if (existingUser) {
      throw new BadRequestException(MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    const user = await this.userService.createUser({
      name: signupDto.name,
      email: signupDto.email,
      password: hashedPassword,
      gender: signupDto.gender,
    });

    const tokens = this.generateTokens(user);

    return {
      message: MESSAGES.AUTH.SIGNUP_SUCCESS,
      user,
      ...tokens,
    };
  }

  // =================================================
  // LOGIN (VALIDATE ONLY)
  // =================================================
  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (!user.password) {
      throw new UnauthorizedException('Use OAuth login');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const tokens = this.generateTokens(user);

    return {
      message: MESSAGES.AUTH.LOGIN_SUCCESS,
      user,
      ...tokens,
    };
  }

  // =================================================
  // GET CURRENT USER BY ID
  // =================================================
  async getMe(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // =================================================
  // OAUTH SYNC (GOOGLE / GITHUB / ETC)
  // =================================================
  async syncUser(syncUserDto: SyncUserDto) {
    let user = await this.userService.findByEmail(syncUserDto.email);

    if (!user) {
      user = await this.userService.createUser({
        name: syncUserDto.name,
        email: syncUserDto.email,
        image: syncUserDto.image,
        provider: syncUserDto.provider,
        isEmailVerified: true,
        gender: syncUserDto.gender,
      });
    } else if (syncUserDto.gender && !user.gender) {
      await this.userService.updateUser(user.id, {
        gender: syncUserDto.gender,
      });
    }

    const tokens = this.generateTokens(user);

    return {
      message: MESSAGES.AUTH.LOGIN_SUCCESS,
      user,
      ...tokens,
    };
  }

  // =================================================
  // LOGOUT (JUST INFO, NO TOKENS)
  // =================================================
  async logout() {
    return {
      message: MESSAGES.AUTH.LOGOUT_SUCCESS,
    };
  }
}
