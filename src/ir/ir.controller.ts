import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { IrService } from './ir.service';
import {
  createIrActivitySchema,
  createIrSubActivitySchema,
  updateIrActivitySchema,
  updateIrActivityStatusSchema,
  queryIrActivitiesSchema,
  queryIrInsightsSchema,
  CreateIrActivityDto,
  CreateIrSubActivityDto,
  UpdateIrActivityDto,
  UpdateIrActivityStatusDto,
  QueryIrActivitiesDto,
  QueryIrInsightsDto,
} from './dto';

@Controller('ir')
@UseGuards(JwtAuthGuard)
export class IrController {
  constructor(private readonly irService: IrService) {}

  /**
   * GET /api/ir/calendar/events
   * Get IR activities for calendar view
   */
  @Get('calendar/events')
  async getCalendarEvents(
    @Query(new ZodValidationPipe(queryIrActivitiesSchema))
    query: QueryIrActivitiesDto,
  ) {
    const result = await this.irService.getCalendarEvents(query);
    return {
      success: true,
      data: result,
      message: 'Calendar events retrieved successfully',
    };
  }

  /**
   * GET /api/ir/timeline/activities
   * Get IR activities for timeline view
   */
  @Get('timeline/activities')
  async getTimelineActivities(
    @Query(new ZodValidationPipe(queryIrActivitiesSchema))
    query: QueryIrActivitiesDto,
  ) {
    const result = await this.irService.getTimelineActivities(query);
    return {
      success: true,
      data: result,
      message: 'Timeline activities retrieved successfully',
    };
  }

  /**
   * GET /api/ir/list/activities
   * Get IR activities for list/table view
   */
  @Get('list/activities')
  async getListViewActivities(
    @Query(new ZodValidationPipe(queryIrActivitiesSchema))
    query: QueryIrActivitiesDto,
  ) {
    const result = await this.irService.getListView(query);
    return {
      success: true,
      data: result,
      message: 'List view activities retrieved successfully',
    };
  }

  /**
   * GET /api/ir/activities/:id
   * Get full IR activity details by ID
   */
  @Get('activities/:id')
  async getActivityById(@Param('id') id: string) {
    const activity = await this.irService.findOne(id);
    return {
      success: true,
      data: activity,
      message: 'Activity retrieved successfully',
    };
  }

  /**
   * POST /api/ir/activities
   * Create a new IR activity
   */
  @Post('activities')
  @HttpCode(HttpStatus.CREATED)
  async createActivity(
    @Body(new ZodValidationPipe(createIrActivitySchema))
    createDto: CreateIrActivityDto,
    @CurrentUserId() userId: string,
  ) {
    const activity = await this.irService.create(createDto, userId);
    return {
      success: true,
      data: activity,
      message: 'Activity created successfully',
    };
  }

  /**
   * PATCH /api/ir/activities/:id
   * Update an IR activity (partial update)
   */
  @Patch('activities/:id')
  async updateActivity(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateIrActivitySchema))
    updateDto: UpdateIrActivityDto,
    @CurrentUserId() userId: string,
  ) {
    const activity = await this.irService.update(id, updateDto, userId);
    return {
      success: true,
      data: activity,
      message: 'Activity updated successfully',
    };
  }

  /**
   * PATCH /api/ir/activities/:id/status
   * Update activity status
   */
  @Patch('activities/:id/status')
  async updateActivityStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateIrActivityStatusSchema))
    statusDto: UpdateIrActivityStatusDto,
    @CurrentUserId() userId: string,
  ) {
    const activity = await this.irService.updateStatus(id, statusDto, userId);
    return {
      success: true,
      data: activity,
      message: 'Activity status updated successfully',
    };
  }

  /**
   * DELETE /api/ir/activities/:id
   * Delete an IR activity
   */
  @Delete('activities/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteActivity(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    await this.irService.remove(id, userId);
  }

  /**
   * POST /api/ir/activities/:id/sub-activities
   * Add a sub-activity to an IR activity
   */
  @Post('activities/:id/sub-activities')
  @HttpCode(HttpStatus.CREATED)
  async addSubActivity(
    @Param('id') activityId: string,
    @Body(new ZodValidationPipe(createIrSubActivitySchema))
    body: CreateIrSubActivityDto,
    @CurrentUserId() userId: string,
  ) {
    const subActivity = await this.irService.addSubActivity(
      activityId,
      body,
      userId,
    );
    return {
      success: true,
      data: subActivity,
      message: 'Sub-activity added successfully',
    };
  }

  /**
   * GET /api/ir/insights
   * Get IR insights and analytics data
   */
  @Get('insights')
  async getInsights(
    @Query(new ZodValidationPipe(queryIrInsightsSchema))
    query: QueryIrInsightsDto,
  ) {
    const insights = await this.irService.getInsights(query);
    return {
      success: true,
      data: insights,
      message: 'IR insights retrieved successfully',
    };
  }

  // TODO: File upload endpoint can be added here
  // POST /api/ir/activities/:id/attachments
  // Requires multipart/form-data handling with file validation
}
