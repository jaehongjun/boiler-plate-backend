import { z } from 'zod';

// Update investor basic info (name, country, city, parent)
export const updateInvestorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  countryCode: z.string().length(2).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  parentId: z.number().int().positive().optional().nullable(),
  isGroupRepresentative: z.boolean().optional(),
});

export type UpdateInvestorDto = z.infer<typeof updateInvestorSchema>;

// Update investor snapshot (metrics/status for specific period)
export const updateInvestorSnapshotSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  quarter: z.number().int().min(1).max(4),

  // Metrics (optional)
  groupRank: z.number().int().positive().optional().nullable(),
  groupChildCount: z.number().int().min(0).optional().nullable(),
  sOverO: z.number().int().optional().nullable(),
  ord: z.number().int().optional().nullable(),
  adr: z.number().int().optional().nullable(),

  // Classifications
  investorType: z
    .enum([
      'INVESTMENT_ADVISOR',
      'HEDGE_FUND',
      'PENSION',
      'SOVEREIGN',
      'MUTUAL_FUND',
      'ETF',
      'BANK',
      'INSURANCE',
      'OTHER',
    ])
    .optional()
    .nullable(),
  styleTag: z
    .enum([
      'POSITIVE',
      'NEUTRAL',
      'NEGATIVE',
      'QUESTION_HEAVY',
      'PICKY',
      'OTHER',
    ])
    .optional()
    .nullable(),
  styleNote: z.string().max(120).optional().nullable(),

  // Status
  turnover: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().nullable(),
  orientation: z.enum(['ACTIVE', 'INACTIVE']).optional().nullable(),

  lastActivityAt: z.string().datetime().optional().nullable(),
});

export type UpdateInvestorSnapshotDto = z.infer<
  typeof updateInvestorSnapshotSchema
>;
