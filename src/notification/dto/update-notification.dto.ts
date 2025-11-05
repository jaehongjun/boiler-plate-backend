import { z } from 'zod';

export const UpdateNotificationDtoSchema = z.object({
  read: z.boolean(),
});

export type UpdateNotificationDto = z.infer<typeof UpdateNotificationDtoSchema>;
