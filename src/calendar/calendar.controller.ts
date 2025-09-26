import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { CalendarService } from './calendar.service';
import {
  CreateCalendarEventDto,
  QueryCalendarRangeDto,
  UpdateCalendarEventDto,
} from './dto/calendar.dto';

@Controller('calendar')
@ApiTags('Calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @UseGuards(JwtAuthGuard)
  @Post('events')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '이벤트 생성' })
  @ApiBody({ type: CreateCalendarEventDto })
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreateCalendarEventDto,
    @CurrentUserId() userId?: string,
  ) {
    const event = await this.calendarService.create(dto, userId);
    return { data: event };
  }

  @UseGuards(JwtAuthGuard)
  @Get('events')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '기간별 이벤트 조회' })
  async list(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: QueryCalendarRangeDto,
  ) {
    const items = await this.calendarService.listInRange(query);
    return { data: items };
  }

  @UseGuards(JwtAuthGuard)
  @Get('events/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '이벤트 상세' })
  async get(@Param('id') id: string) {
    const event = await this.calendarService.findById(Number(id));
    return { data: event };
  }

  @UseGuards(JwtAuthGuard)
  @Put('events/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '이벤트 수정' })
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: UpdateCalendarEventDto,
    @CurrentUserId() userId?: string,
  ) {
    const event = await this.calendarService.update(Number(id), dto, userId);
    return { data: event };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('events/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '이벤트 삭제' })
  async remove(@Param('id') id: string, @CurrentUserId() userId?: string) {
    await this.calendarService.remove(Number(id), userId);
    return { status: 'SUCCESS' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('events/:id/history')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '이벤트 변경 이력 조회' })
  async history(@Param('id') id: string) {
    const rows = await this.calendarService.listHistory(Number(id));
    return { data: rows };
  }
}
