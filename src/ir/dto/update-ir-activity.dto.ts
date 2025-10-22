import { z } from 'zod';
import { createIrActivitySchema } from './create-ir-activity.dto';

// Base: all fields optional from create schema
const baseUpdateSchema = createIrActivitySchema.partial();
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
