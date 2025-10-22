// Response types for IR Activities

export interface IrActivitySubActivityResponse {
  id: string;
  title: string;
  owner?: string;
  status: '예정' | '진행중' | '완료' | '중단';
  startDatetime?: string;
  endDatetime?: string;
}

export interface IrActivityLogResponse {
  id: string;
  type: string;
  user: string;
  message: string;
  createdAtISO: string;
  oldValue?: string;
  newValue?: string;
}

export interface IrActivityAttachmentResponse {
  id: string;
  name: string;
  url?: string;
  size?: number;
  uploadedAtISO?: string;
  uploadedBy?: string;
  mime?: string;
}

// Full IR Activity Entity (for detail modal)
export interface IrActivityEntityResponse {
  // Core fields
  id: string;
  title: string;
  startISO: string;
  endISO?: string;
  status: '예정' | '진행중' | '완료' | '중단';

  // Calendar display
  allDay?: boolean;
  category: '내부' | '외부' | '휴가' | '공휴일';
  location?: string;
  description?: string;

  // Activity details
  typePrimary: string;
  typeSecondary?: string;
  kbs: string[]; // KB staff names
  visitors: string[]; // Investor/broker names
  memo?: string;
  contentHtml?: string;
  keywords?: string[];

  // Files
  files?: IrActivityAttachmentResponse[];
  attachments?: IrActivityAttachmentResponse[];

  // Sub-activities (for timeline)
  subActivities?: IrActivitySubActivityResponse[];

  // Metadata
  owner?: string;
  investors?: string[];
  brokers?: string[];
  logs?: IrActivityLogResponse[];
  createdAtISO?: string;
  updatedAtISO?: string;
  resolvedAtISO?: string;
}

// Simplified calendar event
export interface IrCalendarEventResponse {
  id: string;
  title: string;
  start: string; // ISO datetime
  end?: string; // ISO datetime
  allDay?: boolean;
  category: '내부' | '외부' | '휴가' | '공휴일';
  location?: string;
  description?: string;
}

// Timeline activity (with sub-activities for expansion)
export interface IrTimelineActivityResponse {
  id: string;
  title: string; // Main activity title
  startISO: string;
  endISO: string;
  status: '예정' | '진행중' | '완료' | '중단';
  subActivities?: IrActivitySubActivityResponse[];
}
