import { z } from 'zod';

// GID 업로드 배치 생성 (multipart/form-data)
export const createGidUploadBatchSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  quarter: z.coerce.number().int().min(1).max(4),
  description: z.string().max(500).optional(),
});

export type CreateGidUploadBatchDto = z.infer<
  typeof createGidUploadBatchSchema
>;

// GID 업로드 처리 (파싱 및 스냅샷 생성)
export const processGidUploadSchema = z.object({
  mode: z.enum(['UPSERT', 'REPLACE', 'APPEND']).default('UPSERT'),
  // UPSERT: 기존 스냅샷 업데이트 + 새 데이터 삽입
  // REPLACE: 기존 스냅샷 삭제 후 전체 교체
  // APPEND: 새 데이터만 추가 (중복 무시)
});

export type ProcessGidUploadDto = z.infer<typeof processGidUploadSchema>;

// 파싱된 행 데이터 타입
export interface ParsedGidRow {
  rank?: number | null;
  country: string;
  city?: string | null;
  investorName: string;
  sOverO?: string | null; // numeric type in DB, represented as string
  ord?: number | null;
  adr?: number | null;
  investorType?: string | null;
  styleTag?: string | null;
  styleNote?: string | null;
  turnover?: string | null;
  orientation?: string | null;
  lastActivityAt?: string | null;
}

// 업로드 배치 상태 응답
export interface GidUploadBatchResponse {
  id: number;
  originalFilename: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  meta?: {
    totalRows: number;
    columns: string[];
    fileSize: number;
  };
  uploadedBy?: {
    id: string;
    name: string;
  };
  uploadedAt: string;
  processedAt?: string;
}

// 업로드 처리 결과
export interface ProcessGidUploadResponse {
  uploadBatchId: number;
  status: 'PROCESSED' | 'FAILED';
  result: {
    totalRows: number;
    parsedRows: number;
    failedRows: number;
    createdInvestors: number;
    createdSnapshots: number;
    updatedSnapshots: number;
    historyRecords: number;
  };
  errors?: Array<{
    row: number;
    message: string;
    data?: any;
  }>;
}

// 업로드 행 조회 응답
export interface GidUploadRowsResponse {
  uploadBatchId: number;
  page: number;
  pageSize: number;
  total: number;
  rows: Array<{
    id: number;
    raw: any;
    parsed?: ParsedGidRow;
    mappedInvestorId?: number;
    error?: string;
    createdAt: string;
  }>;
}
