import {
  Controller,
  HttpCode,
  Param,
  Body,
  UseGuards,
  Get,
  Req,
  NotFoundException,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    const user = await this.userService.findById(req.user.sub);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // ======================================================
  // UPDATE USER (With Complete Old Image Cleanup)
  // ======================================================
  @Put(':id')
  @HttpCode(200)
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
    }),
  )
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async updateUser(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      let imagePath: string | undefined;

      // 1. Fetch current user from DB to see if they already have an image
      const currentUser = await this.userService.findById(id);
      if (!currentUser) {
        throw new NotFoundException('User not found');
      }

      // ======================================================
      // HANDLE IMAGE
      // ======================================================
      if (file) {
        const uploadDir = path.join(process.cwd(), 'uploads');

        // Dynamically create the uploads folder if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate the exact file path for the old image based on database records
        if (currentUser.image) {
          // Extracts the filename (e.g., "123.webp") from "/uploads/123.webp"
          const oldFileName = path.basename(currentUser.image);
          const oldImagePath = path.join(uploadDir, oldFileName);

          // Delete the actual old file if it exists on disk
          if (fs.existsSync(oldImagePath)) {
            try {
              fs.unlinkSync(oldImagePath);
            } catch (err) {
              console.log('FAILED TO DELETE PREVIOUS PROFILE IMAGE:', err);
            }
          }
        }

        // Define new image naming convention
        // Using a timestamp avoids browser caching issues where the user updates their image but still sees the old one
        const finalImageName = `${id}-${Date.now()}.webp`;
        const finalImagePath = path.join(uploadDir, finalImageName);

        // Process directly from memory and write out the optimized webp
        await sharp(file.buffer)
          .resize(300, 300, { fit: 'cover' })
          .webp({ quality: 80 })
          .toFile(finalImagePath);

        imagePath = `/uploads/${finalImageName}`;
      }

      // ======================================================
      // UPDATE USER IN DATABASE
      // ======================================================
      const updatedUser = await this.userService.updateUser(id, {
        ...(body.name && { name: body.name }),
        ...(imagePath && { image: imagePath }),
      });

      return {
        success: true,
        message: 'Profile updated successfully!',
        data: updatedUser,
      };
    } catch (error) {
      console.log('UPDATE USER ERROR:', error);
      throw error;
    }
  }
}