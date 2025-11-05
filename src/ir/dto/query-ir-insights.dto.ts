import { z } from 'zod';

/**
 * Schema for querying IR Insights
 * Supports date range filtering for analytics
 */
export const queryIrInsightsSchema = z.object({
  startISO: z.string().datetime().optional(),
  endISO: z.string().datetime().optional(),
});

export type QueryIrInsightsDto = z.infer<typeof queryIrInsightsSchema>;

/**
 * Response Types for IR Insights
 */

// Activity Statistics by Period
export interface ActivityStatsByPeriod {
  period: string; // YYYY-MM format for monthly, YYYY-Q# for quarterly
  total: number;
  byStatus: {
    SCHEDULED: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELLED: number;
  };
}

// Activity Distribution by Type
export interface ActivityDistributionByType {
  typePrimary: string;
  count: number;
  percentage: number;
}

// Activity Distribution by Category
export interface ActivityDistributionByCategory {
  category: string;
  count: number;
  percentage: number;
}

// Top Investors by Activity Count
export interface TopInvestor {
  visitorName: string;
  company: string | null;
  activityCount: number;
  lastActivityDate: string;
}

// KB Staff Activity Ranking
export interface StaffActivityRanking {
  userId: string;
  userName: string;
  activityCount: number;
  asOwner: number;
  asParticipant: number;
}

// Activity Status Overview
export interface ActivityStatusOverview {
  status: string;
  count: number;
  percentage: number;
}

// Keyword Frequency
export interface KeywordFrequency {
  keyword: string;
  count: number;
}

// Meeting Type Efficiency by Quarter
export interface MeetingTypeEfficiencyByQuarter {
  meetingType: string; // 대면미팅, 비대면미팅, NDR, 기타
  currentQuarter: {
    count: number;
    avgShareChangeRate: number; // 평균 지분 변화율 (%)
  };
  previousQuarter: {
    count: number;
    avgShareChangeRate: number; // 평균 지분 변화율 (%)
  };
}

// Investor Responsiveness Heatmap
export interface InvestorResponsivenessCell {
  investorStyle: string; // Growth, Momentum, Deep Value, ESG, GARP, Index, Factor, Smart Beta, Thematic, Event Driven
  strategy: string; // Active, Passive, Opportunistic, Long-term
  value: number; // Intensity value (0-1)
  shareChangeRate: number; // 지분율 변화 (%)
  shareCountChange: number; // 보유주식수 변화
  investorCount: number; // 참여 투자자 수
}

export interface InvestorResponsivenessHeatmap {
  investorStyles: string[]; // Y-axis labels
  strategies: string[]; // X-axis labels
  cells: InvestorResponsivenessCell[];
}

// Keyword and Event Impact
export interface KeywordEventData {
  quarter: string; // 1Q22, 2Q22, etc.
  previousQuarterEventCount: number;
  currentQuarterEventCount: number;
  stockPriceChange: number; // 주가 변화율 (%)
  events: KeywordEvent[];
}

export interface KeywordEvent {
  keyword: string; // 주주환원, 정부정책 등
  eventDate: string; // ISO date
  eventName: string; // 금리 정책 발표 등
  stockPriceChange: number; // 주가 변화율 (%)
}

export interface KeywordEventImpact {
  quarters: KeywordEventData[];
}

// Network Efficiency
export interface NetworkNode {
  id: string;
  name: string;
  type: 'staff' | 'broker' | 'investor'; // staff: KB 담당자, broker: 중개사, investor: 투자자
  size: 'small' | 'medium' | 'large'; // 노드 크기
  level: 'high' | 'medium' | 'low' | 'none'; // 지분 변화 수준
  avgShareChangeRate: number; // 평균 지분 변화율 (%)
}

export interface NetworkEdge {
  source: string; // sourceNodeId
  target: string; // targetNodeId
  strength: 'strong' | 'medium' | 'weak'; // 연결 강도
}

export interface NetworkEfficiency {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  staffRanking: Array<{
    name: string;
    avgShareChangeRate: number;
  }>;
  brokerRanking: Array<{
    name: string;
    avgShareChangeRate: number;
  }>;
}

// Regional Efficiency Map
export interface RegionalDataPoint {
  regionCode: string; // ISO 3166-2 region code (e.g., "KR-11" for Seoul)
  regionName: string; // 지역명 (서울, 경기, 부산 등)
  efficiency: number; // 효율성 점수 (0-100)
  meetingCount: number; // 면담 수
  purchaseResponseRate: number; // 매수 반응률 (%)
  investorCount: number; // 투자자 수
}

export interface RegionalEfficiencyMap {
  regions: RegionalDataPoint[];
  topRegions: Array<{
    regionName: string;
    efficiency: number;
    purchaseResponseRate: number;
  }>;
}

// Meeting-Share Correlation (Scatter Plot)
export interface MeetingShareCorrelationPoint {
  investorName: string; // 투자자명
  investorStyle: string; // 투자 스타일 (Long-term, High turnover 등)
  meetingCount: number; // 면담 횟수 (3개월)
  shareChangeRate: number; // 지분 변화율 (%)
  eum: number; // EUM (in millions USD)
  performanceLevel: 'high' | 'medium' | 'low'; // 성과 수준
}

export interface MeetingShareCorrelation {
  dataPoints: MeetingShareCorrelationPoint[];
  correlationCoefficient: number; // 상관계수 (-1 to 1)
  trendLine: {
    slope: number; // 기울기
    intercept: number; // y절편
  };
  averageShareChange: number; // 평균 지분 변화율
}

// Event-Market Correlation
export interface EventMarketCorrelationCell {
  eventType: string; // 이벤트 유형
  marketIndicator: string; // 시장지표 (주가 변화, 지분 변화, 지분율 변화)
  correlation: number; // 상관계수 (-1 to 1)
  pValue: number; // p-value
  eventCount: number; // 이벤트 횟수
  avgChange: number; // 평균 변화율
}

export interface QuarterlyStockData {
  quarter: string; // 분기 (1Q22, 2Q22, etc.)
  meetingVolume: number; // 면담 수
  stockPrice: number; // 주가
  stockChangeRate: number; // 주가 변화율 (%)
  isHighlight: boolean; // 하이라이트 여부
  events: Array<{
    eventName: string;
    eventType: string;
    eventDate: string; // ISO date string (YYYY-MM-DD)
    shortTermChange: number; // 단기 변화 (%)
    cumulativeChange: number; // 누적 변화 (%)
  }>;
}

export interface EventMarketCorrelation {
  correlationMatrix: EventMarketCorrelationCell[];
  quarterlyData: QuarterlyStockData[];
  eventTypes: string[]; // 이벤트 유형 목록
  marketIndicators: string[]; // 시장지표 목록
}

// IR Efficiency Index Leaderboard
export interface MeetingTypeEfficiency {
  meetingType: string; // 면담 유형
  irei: number; // IR 효율지수
  meetingCount: number; // 면담 수
}

export interface KeywordEfficiency {
  rank: number; // 순위
  keyword: string; // 키워드
  irei: number | null; // IR 효율지수 (null이면 "-" 표시)
}

export interface IrEfficiencyLeaderboard {
  currentIrei: number; // 현재 IREI
  averageIrei: number; // 전체 평균
  irEfficiency: number; // IR 효율 (%)
  comparedToAverage: number; // 평균 대비 (%)
  meetingTypeEfficiencies: MeetingTypeEfficiency[];
  keywordEfficiencies: KeywordEfficiency[];
}

// Main Insights Response
export interface IrInsightsResponse {
  summary: {
    totalActivities: number;
    totalSubActivities: number;
    uniqueInvestors: number;
    uniqueCompanies: number;
    activeKbStaff: number;
  };
  activityStatsByMonth: ActivityStatsByPeriod[];
  activityStatsByQuarter: ActivityStatsByPeriod[];
  distributionByType: ActivityDistributionByType[];
  distributionByCategory: ActivityDistributionByCategory[];
  statusOverview: ActivityStatusOverview[];
  topInvestors: TopInvestor[];
  staffRanking: StaffActivityRanking[];
  topKeywords: KeywordFrequency[];
  meetingTypeEfficiency: MeetingTypeEfficiencyByQuarter[];
  investorResponsiveness: InvestorResponsivenessHeatmap;
  keywordEventImpact: KeywordEventImpact;
  networkEfficiency: NetworkEfficiency;
  regionalEfficiency: RegionalEfficiencyMap;
  meetingShareCorrelation: MeetingShareCorrelation;
  eventMarketCorrelation: EventMarketCorrelation;
  irEfficiencyLeaderboard: IrEfficiencyLeaderboard;
  dateRange: {
    start: string;
    end: string;
  };
}
