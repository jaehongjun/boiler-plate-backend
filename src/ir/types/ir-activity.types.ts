// Response types for IR Activities
import type {
  IrActivityStatus,
  IrActivityCategory,
} from '../constants/ir-activity.constants';

export interface IrActivitySubActivityResponse {
  id: string;
  title: string;
  owner?: string;
  status: IrActivityStatus;
  startDatetime?: string;
  endDatetime?: string;
  // Extended optional fields to align with activity structure
  allDay?: boolean;
  category?: IrActivityCategory;
  location?: string;
  description?: string;
  typePrimary?: string;
  typeSecondary?: string;
  memo?: string;
  contentHtml?: string;
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
  status: IrActivityStatus;

  // Calendar display
  allDay?: boolean;
  category: IrActivityCategory;
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
  category: IrActivityCategory;
  location?: string;
  description?: string;
  status: IrActivityStatus;
}

// Timeline activity (with sub-activities for expansion)
export interface IrTimelineActivityResponse {
  id: string;
  title: string; // Main activity title
  startISO: string;
  endISO: string;
  status: IrActivityStatus;
  subActivities?: IrActivitySubActivityResponse[];
}

// List view activity (for table display)
export interface IrActivityListItemResponse {
  id: string;
  title: string; // 활동명
  startISO: string; // 일시
  endISO?: string;
  typePrimary: string; // 유형 (One-on-One, Conference Call 등)
  status: IrActivityStatus;
  category: IrActivityCategory;

  // 참가자 정보
  investors: string[]; // 투자자
  brokers: string[]; // 방문자 (브로커)
  kbParticipants: string[]; // 면담자 (KB 직원)
  owner?: string; // 담당자

  // 메타데이터
  updatedAtISO: string; // 마지막 업데이트
}
