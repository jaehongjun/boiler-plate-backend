import { z } from 'zod';

// ==================== Response DTOs ====================

export const metricCardSchema = z.object({
  label: z.string(),
  value: z.string(),
  change: z.string(),
  iconType: z.enum(['trending-up', 'bar-chart', 'pie-chart', 'star']),
});

export const chartDataPointSchema = z.object({
  quarter: z.string(),
  value: z.number(),
  rate: z.number().optional(),
});

export const chartSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  data: z.array(chartDataPointSchema),
  highlightedQuarters: z.array(z.string()).optional(),
});

export const meetingHistoryItemSchema = z.object({
  id: z.string(),
  date: z.string(),
  time: z.string(),
  type: z.string(),
  format: z.string(),
  participants: z.string(),
  topics: z.array(z.string()),
  stakeChange: z.string(),
  shareChange: z.string(),
  bookmarked: z.boolean(),
});

export const interestItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number(),
});

export const activityItemSchema = z.object({
  id: z.string(),
  date: z.string(),
  type: z.string(),
  participants: z.string(),
  tags: z.array(z.string()),
  stakeChange: z.string(),
  shareChange: z.string(),
  bookmarked: z.boolean(),
});

export const communicationDetailSchema = z.object({
  name: z.string(),
  values: z.array(z.string()),
});

export const communicationItemSchema = z.object({
  quarter: z.string(),
  type: z.string(),
  details: z.array(communicationDetailSchema),
});

export const investorDetailResponseSchema = z.object({
  id: z.string(),
  rank: z.string(),
  companyName: z.string(),
  country: z.object({
    name: z.string(),
    city: z.string(),
    code: z.string(),
  }),
  style: z.string(),
  type: z.string(),
  turnover: z.enum(['High', 'Medium', 'Low']),
  orientation: z.enum(['Active', 'Inactive']),
  metrics: z.array(metricCardSchema),
  stockHoldingsChart: chartSchema,
  stakeChart: chartSchema,
  meetingHistory: z.array(meetingHistoryItemSchema),
  interests: z.array(interestItemSchema),
  activities: z.array(activityItemSchema),
  communications: z.array(communicationItemSchema),
});

// ==================== TypeScript Types ====================

export type MetricCard = z.infer<typeof metricCardSchema>;
export type ChartDataPoint = z.infer<typeof chartDataPointSchema>;
export type Chart = z.infer<typeof chartSchema>;
export type MeetingHistoryItem = z.infer<typeof meetingHistoryItemSchema>;
export type InterestItem = z.infer<typeof interestItemSchema>;
export type ActivityItem = z.infer<typeof activityItemSchema>;
export type CommunicationDetail = z.infer<typeof communicationDetailSchema>;
export type CommunicationItem = z.infer<typeof communicationItemSchema>;
export type InvestorDetailResponse = z.infer<
  typeof investorDetailResponseSchema
>;
