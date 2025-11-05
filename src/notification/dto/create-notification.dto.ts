import { z } from 'zod';
import { NotificationEventType } from '../../database/schemas/notification.schema';

export const CreateNotificationDtoSchema = z.object({
  userId: z.string().uuid(),
  eventType: z.nativeEnum(NotificationEventType),
  title: z.string().optional(),
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
  read: z.boolean().optional(),
});

export type CreateNotificationDto = z.infer<typeof CreateNotificationDtoSchema>;
