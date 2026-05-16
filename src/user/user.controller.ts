import { Controller, Get, HttpCode, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}
