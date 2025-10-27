import { z } from 'zod';

// Query DTO for calendar/timeline
export const queryIrActivitiesSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  status: z.enum(['예정', '진행중', '완료', '중단', '전체']).optional(),
  category: z.enum(['내부', '외부', '휴가', '공휴일']).optional(),
  sortBy: z
    .enum(['startDatetime', 'updatedAt', 'title', 'status'])
    .optional()
    .default('startDatetime'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type QueryIrActivitiesDto = z.infer<typeof queryIrActivitiesSchema>;
