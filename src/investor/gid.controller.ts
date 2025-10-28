import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { GidService } from './gid.service';
import {
  createGidUploadBatchSchema,
  processGidUploadSchema,
  CreateGidUploadBatchDto,
  ProcessGidUploadDto,
} from './dto/gid-upload.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('gid')
@UseGuards(JwtAuthGuard)
export class GidController {
  constructor(private readonly gidService: GidService) {}

  /**
   * POST /api/gid/uploads
   * 파일 업로드 및 배치 생성
   */
  @Post('uploads')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Only CSV and Excel files are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(createGidUploadBatchSchema))
    dto: CreateGidUploadBatchDto,
    @CurrentUserId() userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.gidService.createUploadBatch(file, dto, userId);

    return {
      success: true,
      data: result,
      message: 'File uploaded successfully',
    };
  }

  /**
   * POST /api/gid/uploads/:id/process
   * 업로드 배치 처리 (파싱 + 스냅샷 생성)
   */
  @Post('uploads/:id/process')
  async processUploadBatch(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(processGidUploadSchema))
    dto: ProcessGidUploadDto,
    @CurrentUserId() userId: string,
  ) {
    const result = await this.gidService.processUploadBatch(id, dto, userId);

    return {
      success: true,
      data: result,
      message:
        result.status === 'PROCESSED'
          ? 'Batch processed successfully'
          : 'Batch processing failed',
    };
  }

  /**
   * GET /api/gid/uploads/:id
   * 업로드 배치 조회
   */
  @Get('uploads/:id')
  async getUploadBatch(@Param('id', ParseIntPipe) id: number) {
    const result = await this.gidService.getUploadBatch(id);

    return {
      success: true,
      data: result,
      message: 'Upload batch retrieved successfully',
    };
  }

  /**
   * GET /api/gid/uploads/:id/rows
   * 업로드 행 조회
   */
  @Get('uploads/:id/rows')
  async getUploadRows(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true }))
    pageSize: number = 100,
    @Query('onlyErrors') onlyErrors?: string,
  ) {
    const result = await this.gidService.getUploadRows(
      id,
      page,
      pageSize,
      onlyErrors === 'true',
    );

    return {
      success: true,
      data: result,
      message: 'Upload rows retrieved successfully',
    };
  }
}
