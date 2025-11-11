import { z } from 'zod';
import { NotificationEventType } from '../../database/schemas/notification.schema';

/**
 * DTO for broadcasting notification to all users
 */
export const BroadcastNotificationDtoSchema = z.object({
  eventType: z.nativeEnum(NotificationEventType),
  title: z.string().min(1, 'Title is required'),
  metadata: z
    .object({
      activityId: z.string().optional(),
      activityTitle: z.string().optional(),
      fieldName: z.string().optional(),
      investorCount: z.number().optional(),
      quarter: z.string().optional(),
      tripId: z.string().optional(),
      tripTitle: z.string().optional(),
      additionalActorCount: z.number().optional(),
      additionalActorIds: z.array(z.string()).optional(),
    })
    .optional(),
});

export type BroadcastNotificationDto = z.infer<
  typeof BroadcastNotificationDtoSchema
>;
