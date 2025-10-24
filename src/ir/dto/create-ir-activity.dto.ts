import { z } from 'zod';

// Sub-activity DTO
// 요구사항: Activity와 동일한 구조이되, 중첩 subActivities만 제외합니다.
export const createIrSubActivitySchema = z.object({
  // Core
  title: z.string().min(1).max(255),
  startDatetime: z.string().datetime().optional(),
  endDatetime: z.string().datetime().optional(),
  status: z.enum(['예정', '진행중', '완료', '중단']).default('예정'),

  // Calendar Display
  allDay: z.boolean().default(false).optional(),
  category: z.enum(['내부', '외부', '휴가', '공휴일']).optional(),
  location: z.string().max(255).optional(),
  description: z.string().optional(),

  // Activity Classification
  typePrimary: z.string().min(1).max(50).optional(),
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
    .default([])
    .optional(),

  // Visitors
  visitors: z
    .array(
      z.object({
        visitorName: z.string().min(1).max(255),
        visitorType: z.enum(['investor', 'broker']).optional(),
        company: z.string().max(255).optional(),
      }),
    )
    .default([])
    .optional(),

  // Keywords (max 5)
  keywords: z.array(z.string().min(1).max(50)).max(5).default([]).optional(),
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
