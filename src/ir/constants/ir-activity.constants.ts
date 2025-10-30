/**
 * IR Activity Constants
 *
 * IR 활동 관리 시스템에서 사용되는 모든 상수 값들을 정의합니다.
 * API/DB에는 영어 키를 사용하고, UI 표시는 한글 라벨을 사용합니다.
 *
 * Reference: IR_ACTIVITY_CONSTANTS.md
 */

// ==========================================
// Activity Status (활동 상태)
// ==========================================

export const IR_ACTIVITY_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SUSPENDED: 'SUSPENDED',
} as const;

export type IrActivityStatus =
  (typeof IR_ACTIVITY_STATUS)[keyof typeof IR_ACTIVITY_STATUS];

export const IR_ACTIVITY_STATUS_LABELS: Record<IrActivityStatus, string> = {
  [IR_ACTIVITY_STATUS.SCHEDULED]: '예정',
  [IR_ACTIVITY_STATUS.IN_PROGRESS]: '진행중',
  [IR_ACTIVITY_STATUS.COMPLETED]: '완료',
  [IR_ACTIVITY_STATUS.SUSPENDED]: '중단',
};

// ==========================================
// Activity Category (활동 카테고리)
// ==========================================

export const IR_ACTIVITY_CATEGORY = {
  INTERNAL: 'INTERNAL',
  EXTERNAL: 'EXTERNAL',
  VACATION: 'VACATION',
  HOLIDAY: 'HOLIDAY',
} as const;

export type IrActivityCategory =
  (typeof IR_ACTIVITY_CATEGORY)[keyof typeof IR_ACTIVITY_CATEGORY];

export const IR_ACTIVITY_CATEGORY_LABELS: Record<IrActivityCategory, string> = {
  [IR_ACTIVITY_CATEGORY.INTERNAL]: '내부',
  [IR_ACTIVITY_CATEGORY.EXTERNAL]: '외부',
  [IR_ACTIVITY_CATEGORY.VACATION]: '휴가',
  [IR_ACTIVITY_CATEGORY.HOLIDAY]: '공휴일',
};

// ==========================================
// Activity Type Primary (활동 유형 - 대분류)
// ==========================================

export const IR_ACTIVITY_TYPE_PRIMARY = {
  NDR: 'NDR',
  CONFERENCE_CALL: 'CONFERENCE_CALL',
  SHAREHOLDERS_MEETING: 'SHAREHOLDERS_MEETING',
  EARNINGS_ANNOUNCEMENT: 'EARNINGS_ANNOUNCEMENT',
  OTHER: 'OTHER',
} as const;

export type IrActivityTypePrimary =
  (typeof IR_ACTIVITY_TYPE_PRIMARY)[keyof typeof IR_ACTIVITY_TYPE_PRIMARY];

export const IR_ACTIVITY_TYPE_PRIMARY_LABELS: Record<
  IrActivityTypePrimary,
  string
> = {
  [IR_ACTIVITY_TYPE_PRIMARY.NDR]: 'NDR',
  [IR_ACTIVITY_TYPE_PRIMARY.CONFERENCE_CALL]: '컨퍼런스콜',
  [IR_ACTIVITY_TYPE_PRIMARY.SHAREHOLDERS_MEETING]: '주주총회',
  [IR_ACTIVITY_TYPE_PRIMARY.EARNINGS_ANNOUNCEMENT]: '실적발표',
  [IR_ACTIVITY_TYPE_PRIMARY.OTHER]: '기타',
};

// ==========================================
// Activity Type Secondary (활동 유형 - 소분류)
// ==========================================

export const IR_ACTIVITY_TYPE_SECONDARY = {
  STRATEGY_MEETING: 'STRATEGY_MEETING',
  ONE_ON_ONE: 'ONE_ON_ONE',
  GROUP_MEETING: 'GROUP_MEETING',
  OTHER: 'OTHER',
} as const;

export type IrActivityTypeSecondary =
  (typeof IR_ACTIVITY_TYPE_SECONDARY)[keyof typeof IR_ACTIVITY_TYPE_SECONDARY];

export const IR_ACTIVITY_TYPE_SECONDARY_LABELS: Record<
  IrActivityTypeSecondary,
  string
> = {
  [IR_ACTIVITY_TYPE_SECONDARY.STRATEGY_MEETING]: '전략회의',
  [IR_ACTIVITY_TYPE_SECONDARY.ONE_ON_ONE]: '1:1미팅',
  [IR_ACTIVITY_TYPE_SECONDARY.GROUP_MEETING]: '그룹미팅',
  [IR_ACTIVITY_TYPE_SECONDARY.OTHER]: '기타',
};

// ==========================================
// Activity Limits (제약사항)
// ==========================================

export const IR_ACTIVITY_LIMITS = {
  MAX_PARTICIPANTS: 50, // 최대 면담자(KB) 수
  MAX_VISITORS: 50, // 최대 방문자(투자자, 증권사) 수
  MAX_FILES: 10, // 최대 첨부파일 수
  MAX_FILE_SIZE_MB: 50, // 파일당 최대 크기 (MB)
  MAX_TOTAL_FILE_SIZE_MB: 500, // 전체 파일 최대 크기 (MB)
  MAX_KEYWORDS: 5, // 최대 키워드 수
} as const;

// Conversion to bytes for validation
export const IR_ACTIVITY_LIMITS_BYTES = {
  MAX_FILE_SIZE: IR_ACTIVITY_LIMITS.MAX_FILE_SIZE_MB * 1024 * 1024,
  MAX_TOTAL_FILE_SIZE: IR_ACTIVITY_LIMITS.MAX_TOTAL_FILE_SIZE_MB * 1024 * 1024,
} as const;

// ==========================================
// Helper Functions
// ==========================================

/**
 * Validates if a given status is valid
 */
export function isValidIrActivityStatus(
  status: string,
): status is IrActivityStatus {
  return Object.values(IR_ACTIVITY_STATUS).includes(status as IrActivityStatus);
}

/**
 * Validates if a given category is valid
 */
export function isValidIrActivityCategory(
  category: string,
): category is IrActivityCategory {
  return Object.values(IR_ACTIVITY_CATEGORY).includes(
    category as IrActivityCategory,
  );
}

/**
 * Gets Korean label for status
 */
export function getStatusLabel(status: IrActivityStatus): string {
  return IR_ACTIVITY_STATUS_LABELS[status] || status;
}

/**
 * Gets Korean label for category
 */
export function getCategoryLabel(category: IrActivityCategory): string {
  return IR_ACTIVITY_CATEGORY_LABELS[category] || category;
}

/**
 * Gets English key from Korean status label (for backward compatibility)
 */
export function getStatusKeyFromLabel(label: string): IrActivityStatus | null {
  const entry = Object.entries(IR_ACTIVITY_STATUS_LABELS).find(
    ([_, value]) => value === label,
  );
  return entry ? (entry[0] as IrActivityStatus) : null;
}

/**
 * Gets English key from Korean category label (for backward compatibility)
 */
export function getCategoryKeyFromLabel(
  label: string,
): IrActivityCategory | null {
  const entry = Object.entries(IR_ACTIVITY_CATEGORY_LABELS).find(
    ([_, value]) => value === label,
  );
  return entry ? (entry[0] as IrActivityCategory) : null;
}
