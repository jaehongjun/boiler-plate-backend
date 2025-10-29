import { z } from 'zod';

// Query DTO for calendar/timeline
export const queryIrActivitiesSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  status: z
    .enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED', 'ALL'])
    .optional(),
  category: z
    .enum(['INTERNAL', 'EXTERNAL', 'VACATION', 'HOLIDAY'])
    .optional(),
  sortBy: z
    .enum(['startDatetime', 'updatedAt', 'title', 'status'])
    .optional()
    .default('startDatetime'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type QueryIrActivitiesDto = z.infer<typeof queryIrActivitiesSchema>;
