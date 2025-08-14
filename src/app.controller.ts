import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('기본')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: '헬스체크',
    description: '서버 상태를 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '서버 정상 동작',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Hello World!' },
      },
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
