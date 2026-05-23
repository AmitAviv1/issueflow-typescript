import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AttachmentsService } from './attachments.service';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller('tickets/:ticketId/attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Unsupported file type. Allowed: PNG, JPEG, PDF, plain text',
            ),
            false,
          );
        }
      },
    }),
  )
  upload(
    @Param('ticketId') ticketId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded or file rejected (max 10MB; PNG/JPEG/PDF/TXT only)',
      );
    }
    return this.attachmentsService.create(
      Number(ticketId),
      file.originalname,
      file.mimetype,
      file.path,
    );
  }

  @Delete(':attachmentId')
  remove(@Param('attachmentId') attachmentId: string) {
    return this.attachmentsService.remove(Number(attachmentId));
  }
}
