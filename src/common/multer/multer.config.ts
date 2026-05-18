import { diskStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

export const multerOptions = {
  storage: diskStorage({

    destination: './uploads',

    filename: (req, file, cb) => {

      // user id from route
      const userId = req.params.id;

      // ALWAYS SAVE AS WEBP
      cb(null, `${userId}.webp`);
    },
  }),

  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },

  fileFilter: (req, file, cb) => {

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
    ];

    if (
      !allowedMimeTypes.includes(
        file.mimetype,
      )
    ) {
      return cb(
        new BadRequestException(
          'Only image files allowed',
        ),
        false,
      );
    }

    cb(null, true);
  },
};