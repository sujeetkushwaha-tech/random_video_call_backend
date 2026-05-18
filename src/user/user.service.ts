import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Gender } from './entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    return await this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async createUser(data: Partial<User>) {
    const user = this.userRepository.create(data);
    const savedUser = await this.userRepository.save(user);

    /*
      REMOVE PASSWORD
    */
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  /*
    UPDATE USER 
  */
  async updateUser(userId: string, data: Partial<User>) {
    // 1. Verify user exists
    const userExists = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    // 2. Update — image path already clean from controller
    await this.userRepository.update(userId, data);

    // 3. Return safe user
    const updated = await this.userRepository.findOne({
      where: { id: userId },
    });

    const { password, refreshToken, ...safeUser } = updated!;
    return safeUser;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    await this.userRepository.update(userId, {
      refreshToken,
    });
  }

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });
    if (!user) return null;
    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }
}
