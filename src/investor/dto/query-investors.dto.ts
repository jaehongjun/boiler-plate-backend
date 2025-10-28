import { z } from 'zod';

// Query DTO for investor table view
export const queryInvestorsTableSchema = z.object({
  // Period (required)
  year: z.coerce.number().int().min(2000).max(2100),
  quarter: z.coerce.number().int().min(1).max(4),

  // Filters
  search: z.string().optional(), // 투자자명/국가/도시 검색
  country: z.string().length(2).optional(), // ISO-2 country code
  orientation: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  turnover: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
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
    .optional(),
  styleTag: z
    .enum([
      'POSITIVE',
      'NEUTRAL',
      'NEGATIVE',
      'QUESTION_HEAVY',
      'PICKY',
      'OTHER',
    ])
    .optional(),

  // Options
  onlyParent: z.coerce.boolean().default(false), // 모회사만
  includeChildren: z.coerce.boolean().default(true), // 자회사 포함

  // Sort & Pagination
  sort: z
    .enum([
      'rank',
      'country',
      'name',
      'sOverO',
      'ord',
      'adr',
      'turnover',
      'orientation',
      'lastActivityAt',
    ])
    .optional()
    .default('rank'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type QueryInvestorsTableDto = z.infer<typeof queryInvestorsTableSchema>;

// Query DTO for investor history
export const queryInvestorHistorySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  quarter: z.coerce.number().int().min(1).max(4).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type QueryInvestorHistoryDto = z.infer<
  typeof queryInvestorHistorySchema
>;

// Query DTO for single investor detail
export const queryInvestorDetailSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  quarter: z.coerce.number().int().min(1).max(4),
});

export type QueryInvestorDetailDto = z.infer<typeof queryInvestorDetailSchema>;

// Query DTO for top N investors
export const queryTopInvestorsSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  quarter: z.coerce.number().int().min(1).max(4),
  topN: z.coerce.number().int().min(1).max(100).default(10),
});

export type QueryTopInvestorsDto = z.infer<typeof queryTopInvestorsSchema>;
