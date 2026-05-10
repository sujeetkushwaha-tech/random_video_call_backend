import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

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

  async updateRefreshToken(userId: string, refreshToken: string) {
    await this.userRepository.update(userId, {
      refreshToken,
    });
  }

  async findById(id: string) {
    return await this.userRepository.findOne({
      where: {
        id,
      },
    });
  }
}
