/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { FilesService } from './files.service';

type MulterFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

function isMulterFile(file: unknown): file is MulterFile {
  if (!file || typeof file !== 'object') return false;
  const f = file as Record<string, unknown>;
  return (
    typeof f.originalname === 'string' &&
    typeof f.mimetype === 'string' &&
    typeof f.size === 'number' &&
    f.buffer instanceof Buffer
  );
}

function decodeLatin1ToUtf8(input: string): string {
  // Multer/Busboy sometimes give filename in latin1 for non-ASCII. Re-encode.
  try {
    return Buffer.from(input, 'latin1').toString('utf8');
  } catch {
    return input;
  }
}

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // Default path expected by frontend when VITE_FILE_UPLOAD_URL is not set
  @UseGuards(OptionalJwtAuthGuard)
  @Post('uploads')
  @UseInterceptors(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadAtRoot(
    @UploadedFile() file: unknown,
    @Body() body: Record<string, unknown>,
  ) {
    if (!isMulterFile(file)) throw new BadRequestException('Invalid file');
    const overrideName =
      typeof body?.originalFilename === 'string' && body.originalFilename.trim()
        ? (body.originalFilename as string)
        : undefined;
    const safeName = overrideName ?? decodeLatin1ToUtf8(file.originalname);
    return await this.filesService.uploadBuffer({
      buffer: file.buffer,
      originalname: safeName,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  // Alternative path if frontend sets VITE_FILE_UPLOAD_URL=http://.../api/files/upload
  // We rely on global prefix 'api' so controller path is just 'files/upload'
  @UseGuards(OptionalJwtAuthGuard)
  @Post('files/upload')
  @UseInterceptors(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadAtApi(
    @UploadedFile() file: unknown,
    @Body() body: Record<string, unknown>,
  ) {
    if (!isMulterFile(file)) throw new BadRequestException('Invalid file');
    const overrideName =
      typeof body?.originalFilename === 'string' && body.originalFilename.trim()
        ? (body.originalFilename as string)
        : undefined;
    const safeName = overrideName ?? decodeLatin1ToUtf8(file.originalname);
    return await this.filesService.uploadBuffer({
      buffer: file.buffer,
      originalname: safeName,
      mimetype: file.mimetype,
      size: file.size,
    });
  }
}
