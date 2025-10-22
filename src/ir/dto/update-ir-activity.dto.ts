import { z } from 'zod';
import { createIrActivitySchema } from './create-ir-activity.dto';

// Update DTO - all fields optional
export const updateIrActivitySchema = createIrActivitySchema.partial();

export type UpdateIrActivityDto = z.infer<typeof updateIrActivitySchema>;

// Update status DTO
export const updateIrActivityStatusSchema = z.object({
  status: z.enum(['예정', '진행중', '완료', '중단']),
});

export type UpdateIrActivityStatusDto = z.infer<
  typeof updateIrActivityStatusSchema
>;
