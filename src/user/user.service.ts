import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, Gender } from './entities/user.entity';
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

  async updateUser(userId: string, data: Partial<User>) {
    await this.userRepository.update(userId, data);
    const updated = await this.userRepository.findOne({
      where: { id: userId },
    });
    const { password, ...safeUser } = updated!;
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
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
