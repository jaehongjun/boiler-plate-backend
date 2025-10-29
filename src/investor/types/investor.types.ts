/**
 * Investor API Response Types
 */

// Row type in table view
export type InvestorRowType = 'PARENT' | 'CHILD';

// Country info
export interface CountryInfo {
  code: string | null;
  name: string;
  city?: string;
}

// Investor basic info
export interface InvestorBasicInfo {
  id: number;
  name: string;
  country: CountryInfo;
}

// Metrics for a snapshot
export interface InvestorMetrics {
  sOverO: number | null;
  ord: number | null;
  adr: number | null;
  investorType: string | null;
  style: {
    tag: string | null;
    note: string | null;
  };
  turnover: string | null;
  orientation: string | null;
  lastActivityAt: string | null; // ISO string
}

// Group info (for parent rows)
export interface GroupInfo {
  rank: number | null;
  childCount: number | null;
}

// Single table row (parent or child)
export interface InvestorTableRow {
  rowType: InvestorRowType;
  parentId?: number; // Only for CHILD rows
  group?: GroupInfo; // Only for PARENT rows
  investor: InvestorBasicInfo;
  metrics: InvestorMetrics;
}

// Table response
export interface InvestorTableResponse {
  period: {
    year: number;
    quarter: number;
  } | null; // null when fetching latest data for each investor (mixed periods)
  page: number;
  pageSize: number;
  total: number;
  rows: InvestorTableRow[];
}

// Single investor detail
export interface InvestorDetailResponse {
  investor: {
    id: number;
    name: string;
    country: string | null;
    city: string | null;
    parentId: number | null;
    isGroupRepresentative: boolean;
  };
  snapshot: {
    year: number;
    quarter: number;
    groupRank: number | null;
    childCount: number | null;
    sOverO: number | null;
    ord: number | null;
    adr: number | null;
    investorType: string | null;
    style: {
      tag: string | null;
      note: string | null;
    };
    turnover: string | null;
    orientation: string | null;
    lastActivityAt: string | null;
  } | null;
}

// History record
export interface InvestorHistoryRecord {
  occurredAt: string; // ISO
  year: number;
  quarter: number;
  updatedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  changes: Record<string, [any, any]>;
}

// History response
export interface InvestorHistoryResponse {
  investorId: number;
  history: InvestorHistoryRecord[];
  page: number;
  pageSize: number;
  total: number;
}

// Filters dictionaries
export interface FiltersResponse {
  countries: Array<{ code: string; name: string }>;
  investorTypes: string[];
  styleTags: string[];
  turnovers: string[];
  orientations: string[];
}

// Periods available
export interface PeriodsResponse {
  periods: Array<{ year: number; quarter: number }>;
}

// Summary metrics
export interface SummaryMetricsResponse {
  totalInvestors: number;
  parents: number;
  children: number;
  activeRate: number;
  turnoverDist: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
}

// Top investors
export interface TopInvestorItem {
  investorId: number;
  name: string;
  countryCode: string | null;
  city: string | null;
  groupRank: number | null;
  groupChildCount: number | null;
  orientation: string | null;
}

export interface TopInvestorsResponse {
  topN: number;
  investors: TopInvestorItem[];
}
