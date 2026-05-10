import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { PassportModule } from '@nestjs/passport';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/user/entities/user.entity';

import { AuthController } from './auth.controller';

import { AuthService } from './auth.service';

import { JwtStrategy } from './strategies/jwt.strategy';

import { UserService } from 'src/user/user.service';

@Module({
  imports: [
    PassportModule,

    JwtModule.register({}),

    TypeOrmModule.forFeature([User]),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    UserService,
  ],
})
export class AuthModule {}