import { z } from 'zod';

// Sub-activity DTO
export const createIrSubActivitySchema = z.object({
  title: z.string().min(1).max(255),
  ownerId: z.string().uuid().optional(),
  status: z.enum(['예정', '진행중', '완료', '중단']).default('예정'),
  startDatetime: z.string().datetime().optional(),
  endDatetime: z.string().datetime().optional(),
  displayOrder: z.number().int().default(0),
});

// Main IR Activity DTO
export const createIrActivitySchema = z.object({
  title: z.string().min(1).max(255),
  startDatetime: z.string().datetime(),
  endDatetime: z.string().datetime().optional(),
  status: z.enum(['예정', '진행중', '완료', '중단']).default('예정'),

  // Calendar Display
  allDay: z.boolean().default(false),
  category: z.enum(['내부', '외부', '휴가', '공휴일']),
  location: z.string().max(255).optional(),
  description: z.string().optional(),

  // Activity Classification
  typePrimary: z.string().min(1).max(50),
  typeSecondary: z.string().max(50).optional(),

  // Rich Content
  memo: z.string().optional(),
  contentHtml: z.string().optional(),

  // Ownership
  ownerId: z.string().uuid().optional(),

  // Participants
  kbParticipants: z
    .array(
      z.object({
        userId: z.string().uuid(),
        role: z.string().max(50).optional(),
      }),
    )
    .default([]),

  // Visitors
  visitors: z
    .array(
      z.object({
        visitorName: z.string().min(1).max(255),
        visitorType: z.enum(['investor', 'broker']).optional(),
        company: z.string().max(255).optional(),
      }),
    )
    .default([]),

  // Keywords (max 5)
  keywords: z.array(z.string().min(1).max(50)).max(5).default([]),

  // Sub-activities
  subActivities: z.array(createIrSubActivitySchema).default([]),
});

export type CreateIrActivityDto = z.infer<typeof createIrActivitySchema>;
export type CreateIrSubActivityDto = z.infer<typeof createIrSubActivitySchema>;
