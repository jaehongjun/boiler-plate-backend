import { z } from 'zod';
import {
  createIrActivitySchema,
  createIrSubActivitySchema,
} from './create-ir-activity.dto';

// Allow sub-activity update items to include id + partial fields
export const updateIrSubActivitySchema = createIrSubActivitySchema
  .partial()
  .extend({
    id: z.string().min(1),
  });

// Base: all fields optional from create schema, but subActivities use update schema
const baseUpdateSchema = createIrActivitySchema.partial().extend({
  subActivities: z.array(updateIrSubActivitySchema).optional(),
});
type BaseUpdate = z.infer<typeof baseUpdateSchema>;

// Support both startDatetime/endDatetime and startISO/endISO for backward/FE compatibility.
// If startISO/endISO are provided, map them to startDatetime/endDatetime.
type WithISO = BaseUpdate & {
  startISO?: string;
  endISO?: string;
};

export const updateIrActivitySchema = z
  .object({
    startISO: z.string().datetime().optional(),
    endISO: z.string().datetime().optional(),
  })
  .merge(baseUpdateSchema)
  .transform((data: WithISO): BaseUpdate => {
    const { startISO, endISO, ...rest } = data;
    const mapped: BaseUpdate = { ...(rest as BaseUpdate) };

    if (startISO && !mapped.startDatetime) {
      mapped.startDatetime = startISO;
    }

    if (endISO && !mapped.endDatetime) {
      mapped.endDatetime = endISO;
    }

    return mapped;
  });

export type UpdateIrActivityDto = z.infer<typeof baseUpdateSchema>;

// Update status DTO
export const updateIrActivityStatusSchema = z.object({
  status: z.enum(['예정', '진행중', '완료', '중단']),
});

export type UpdateIrActivityStatusDto = z.infer<
  typeof updateIrActivityStatusSchema
>;

// Export type for service usage
export type UpdateIrSubActivityDto = z.infer<typeof updateIrSubActivitySchema>;
