import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

import { NotificationService } from './notification.service';
import {
  CreateNotificationDto,
  CreateNotificationDtoSchema,
  UpdateNotificationDto,
  UpdateNotificationDtoSchema,
} from './dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * POST /api/notifications
   * Create a new notification (mainly for testing/admin)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateNotificationDtoSchema))
    dto: CreateNotificationDto,
  ) {
    const notification = await this.notificationService.create(dto);
    return {
      success: true,
      data: notification,
      message: 'Notification created successfully',
    };
  }

  /**
   * GET /api/notifications
   * Get all notifications for the current user
   */
  @Get()
  async findAll(
    @CurrentUserId() userId: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const notifications = await this.notificationService.findByUserId(
      userId,
      unreadOnly === 'true',
    );
    return {
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully',
    };
  }

  /**
   * GET /api/notifications/unread-count
   * Get unread notification count
   */
  @Get('unread-count')
  async getUnreadCount(@CurrentUserId() userId: string) {
    const count = await this.notificationService.getUnreadCount(userId);
    return {
      success: true,
      data: { count },
      message: 'Unread count retrieved successfully',
    };
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark a notification as read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    const notification = await this.notificationService.markAsRead(id, userId);
    return {
      success: true,
      data: notification,
      message: 'Notification marked as read',
    };
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read
   */
  @Patch('read-all')
  async markAllAsRead(@CurrentUserId() userId: string) {
    await this.notificationService.markAllAsRead(userId);
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  /**
   * DELETE /api/notifications/:id
   * Delete a notification
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @CurrentUserId() userId: string) {
    await this.notificationService.delete(id, userId);
    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }
}
