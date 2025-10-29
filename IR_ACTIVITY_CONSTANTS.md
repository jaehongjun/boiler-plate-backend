# IR Activity Constants - Backend Reference

## Overview

이 문서는 IR 활동 관리 시스템에서 사용되는 모든 상수 값들을 정의합니다.
**API/DB에는 영어 키를 사용하고, UI 표시는 한글 라벨을 사용합니다.**

**관리 방식**: 공통코드 테이블(`common_codes`)에서 중앙집중식으로 관리
**백엔드 구현 위치**:
- Constants: `src/ir/constants/ir-activity.constants.ts`
- Common Code Schema: `src/database/schemas/common-code.schema.ts`
- Seed Data: `src/database/seeds/common-code.seed.ts`

**프론트엔드 구현 위치**: `app/features/ir/calendar/model/constants.ts`

---

## 1. Activity Status (활동 상태)

### Enum Values

| Key | API/DB Value | UI Label (한글) | Description | Usage |
|-----|--------------|----------------|-------------|-------|
| `SCHEDULED` | `"SCHEDULED"` | `"예정"` | 예정된 활동 | 기본값, 아직 시작하지 않은 활동 |
| `IN_PROGRESS` | `"IN_PROGRESS"` | `"진행중"` | 진행 중인 활동 | 현재 진행 중 |
| `COMPLETED` | `"COMPLETED"` | `"완료"` | 완료된 활동 | 활동 완료, `resolvedAt` 타임스탬프 설정 |
| `SUSPENDED` | `"SUSPENDED"` | `"중단"` | 중단된 활동 | 취소되거나 중단된 활동 |

### Database Schema

**공통코드 테이블 방식 사용** - Enum 대신 `common_codes` 테이블에서 관리

```sql
-- Status는 common_codes 테이블에서 관리
ALTER TABLE ir_activities
  ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED';

-- Common codes 테이블에 데이터 삽입 (seed data로 관리)
-- code_group: 'IR_ACTIVITY_STATUS'
-- code_key: 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED'
```

### TypeScript Type (Backend)

**위치**: `src/ir/constants/ir-activity.constants.ts`

```typescript
export const IR_ACTIVITY_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SUSPENDED: 'SUSPENDED',
} as const;

export type IrActivityStatus =
  (typeof IR_ACTIVITY_STATUS)[keyof typeof IR_ACTIVITY_STATUS];

// UI 라벨 매핑
export const IR_ACTIVITY_STATUS_LABELS: Record<IrActivityStatus, string> = {
  SCHEDULED: '예정',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  SUSPENDED: '중단',
};
```

### API Example

```json
{
  "id": "act-123",
  "title": "정기 IR 미팅",
  "status": "SCHEDULED"
}
```

---

## 2. Activity Category (활동 카테고리)

### Enum Values

| Key | API/DB Value | UI Label (한글) | Description | Color Reference |
|-----|--------------|----------------|-------------|-----------------|
| `INTERNAL` | `"INTERNAL"` | `"내부"` | 내부 활동 | Blue |
| `EXTERNAL` | `"EXTERNAL"` | `"외부"` | 외부 활동 (IR, 미팅 등) | Green |
| `VACATION` | `"VACATION"` | `"휴가"` | 휴가 | Orange |
| `HOLIDAY` | `"HOLIDAY"` | `"공휴일"` | 공휴일 | Red |

### Database Schema

**공통코드 테이블 방식 사용** - Enum 대신 `common_codes` 테이블에서 관리

```sql
-- Category는 common_codes 테이블에서 관리
ALTER TABLE ir_activities
  ADD COLUMN category VARCHAR(50) NOT NULL;

-- Common codes 테이블에 데이터 삽입 (seed data로 관리)
-- code_group: 'IR_ACTIVITY_CATEGORY'
-- code_key: 'INTERNAL', 'EXTERNAL', 'VACATION', 'HOLIDAY'
```

### TypeScript Type (Backend)

**위치**: `src/ir/constants/ir-activity.constants.ts`

```typescript
export const IR_ACTIVITY_CATEGORY = {
  INTERNAL: 'INTERNAL',
  EXTERNAL: 'EXTERNAL',
  VACATION: 'VACATION',
  HOLIDAY: 'HOLIDAY',
} as const;

export type IrActivityCategory =
  (typeof IR_ACTIVITY_CATEGORY)[keyof typeof IR_ACTIVITY_CATEGORY];

// UI 라벨 매핑 (with colors)
export const IR_ACTIVITY_CATEGORY_LABELS: Record<IrActivityCategory, string> = {
  INTERNAL: '내부',
  EXTERNAL: '외부',
  VACATION: '휴가',
  HOLIDAY: '공휴일',
};
```

### API Example

```json
{
  "id": "act-123",
  "title": "정기 IR 미팅",
  "category": "EXTERNAL"
}
```

---

## 3. Activity Type Primary (활동 유형 - 대분류)

### Enum Values

| Key | API/DB Value | UI Label (한글) | Description |
|-----|--------------|----------------|-------------|
| `NDR` | `"NDR"` | `"NDR"` | Non-Deal Roadshow |
| `CONFERENCE_CALL` | `"CONFERENCE_CALL"` | `"컨퍼런스콜"` | Conference Call |
| `SHAREHOLDERS_MEETING` | `"SHAREHOLDERS_MEETING"` | `"주주총회"` | Shareholders Meeting |
| `EARNINGS_ANNOUNCEMENT` | `"EARNINGS_ANNOUNCEMENT"` | `"실적발표"` | Earnings Announcement |
| `OTHER` | `"OTHER"` | `"기타"` | Other activities |

### Database Schema

```sql
-- String type, no enum needed
ALTER TABLE ir_activities
  ADD COLUMN type_primary VARCHAR(50) NOT NULL;
```

### TypeScript Type (Backend)

**위치**: `src/ir/constants/ir-activity.constants.ts`

```typescript
export const IR_ACTIVITY_TYPE_PRIMARY = {
  NDR: 'NDR',
  CONFERENCE_CALL: 'CONFERENCE_CALL',
  SHAREHOLDERS_MEETING: 'SHAREHOLDERS_MEETING',
  EARNINGS_ANNOUNCEMENT: 'EARNINGS_ANNOUNCEMENT',
  OTHER: 'OTHER',
} as const;

export type IrActivityTypePrimary =
  (typeof IR_ACTIVITY_TYPE_PRIMARY)[keyof typeof IR_ACTIVITY_TYPE_PRIMARY];

export const IR_ACTIVITY_TYPE_PRIMARY_LABELS: Record<IrActivityTypePrimary, string> = {
  NDR: 'NDR',
  CONFERENCE_CALL: '컨퍼런스콜',
  SHAREHOLDERS_MEETING: '주주총회',
  EARNINGS_ANNOUNCEMENT: '실적발표',
  OTHER: '기타',
};
```

### API Example

```json
{
  "id": "act-123",
  "typePrimary": "NDR",
  "typeSecondary": "STRATEGY_MEETING"
}
```

---

## 4. Activity Type Secondary (활동 유형 - 소분류)

### Enum Values

| Key | API/DB Value | UI Label (한글) | Description |
|-----|--------------|----------------|-------------|
| `STRATEGY_MEETING` | `"STRATEGY_MEETING"` | `"전략회의"` | Strategy Meeting |
| `ONE_ON_ONE` | `"ONE_ON_ONE"` | `"1:1미팅"` | One-on-one Meeting |
| `GROUP_MEETING` | `"GROUP_MEETING"` | `"그룹미팅"` | Group Meeting |
| `OTHER` | `"OTHER"` | `"기타"` | Other meeting types |

### Database Schema

```sql
-- String type, no enum needed
ALTER TABLE ir_activities
  ADD COLUMN type_secondary VARCHAR(50);
```

### TypeScript Type (Backend)

**위치**: `src/ir/constants/ir-activity.constants.ts`

```typescript
export const IR_ACTIVITY_TYPE_SECONDARY = {
  STRATEGY_MEETING: 'STRATEGY_MEETING',
  ONE_ON_ONE: 'ONE_ON_ONE',
  GROUP_MEETING: 'GROUP_MEETING',
  OTHER: 'OTHER',
} as const;

export type IrActivityTypeSecondary =
  (typeof IR_ACTIVITY_TYPE_SECONDARY)[keyof typeof IR_ACTIVITY_TYPE_SECONDARY];

export const IR_ACTIVITY_TYPE_SECONDARY_LABELS: Record<IrActivityTypeSecondary, string> = {
  STRATEGY_MEETING: '전략회의',
  ONE_ON_ONE: '1:1미팅',
  GROUP_MEETING: '그룹미팅',
  OTHER: '기타',
};
```

---

## 5. Activity Limits (제약사항)

### Constraints

| Limit | Value | Description |
|-------|-------|-------------|
| `MAX_PARTICIPANTS` | `50` | 최대 면담자(KB) 수 |
| `MAX_VISITORS` | `50` | 최대 방문자(투자자, 증권사) 수 |
| `MAX_FILES` | `10` | 최대 첨부파일 수 |
| `MAX_FILE_SIZE_MB` | `50` | 파일당 최대 크기 (MB) |
| `MAX_TOTAL_FILE_SIZE_MB` | `500` | 전체 파일 최대 크기 (MB) |
| `MAX_KEYWORDS` | `5` | 최대 키워드 수 |

### Database Constraints

```sql
-- Add check constraints
ALTER TABLE ir_activity_kb_participants
  ADD CONSTRAINT check_max_participants
  CHECK ((SELECT COUNT(*) FROM ir_activity_kb_participants WHERE activity_id = activity_id) <= 50);

ALTER TABLE ir_activity_visitors
  ADD CONSTRAINT check_max_visitors
  CHECK ((SELECT COUNT(*) FROM ir_activity_visitors WHERE activity_id = activity_id) <= 50);

ALTER TABLE ir_activity_keywords
  ADD CONSTRAINT check_max_keywords
  CHECK ((SELECT COUNT(*) FROM ir_activity_keywords WHERE activity_id = activity_id) <= 5);

ALTER TABLE ir_activity_attachments
  ADD CONSTRAINT check_file_size
  CHECK (size <= 52428800); -- 50MB in bytes

ALTER TABLE ir_activity_attachments
  ADD CONSTRAINT check_max_files
  CHECK ((SELECT COUNT(*) FROM ir_activity_attachments WHERE activity_id = activity_id) <= 10);
```

### Backend Validation

```typescript
export const IR_ACTIVITY_LIMITS = {
  MAX_PARTICIPANTS: 50,
  MAX_VISITORS: 50,
  MAX_FILES: 10,
  MAX_FILE_SIZE_MB: 50,
  MAX_TOTAL_FILE_SIZE_MB: 500,
  MAX_KEYWORDS: 5,
} as const;

// Validation example
function validateActivityCreation(dto: CreateIrActivityDto) {
  if (dto.kbs && dto.kbs.length > IR_ACTIVITY_LIMITS.MAX_PARTICIPANTS) {
    throw new Error(`최대 ${IR_ACTIVITY_LIMITS.MAX_PARTICIPANTS}명까지 추가할 수 있습니다`);
  }

  if (dto.visitors && dto.visitors.length > IR_ACTIVITY_LIMITS.MAX_VISITORS) {
    throw new Error(`최대 ${IR_ACTIVITY_LIMITS.MAX_VISITORS}명까지 추가할 수 있습니다`);
  }

  if (dto.keywords && dto.keywords.length > IR_ACTIVITY_LIMITS.MAX_KEYWORDS) {
    throw new Error(`최대 ${IR_ACTIVITY_LIMITS.MAX_KEYWORDS}개까지 추가할 수 있습니다`);
  }
}
```

---

## 6. Complete Request/Response Examples

### Create Activity Request

```json
POST /api/ir/activities
Content-Type: application/json

{
  "title": "정기 IR 미팅",
  "startDatetime": "2025-10-30T12:00:00.000Z",
  "endDatetime": "2025-10-30T14:00:00.000Z",
  "status": "SCHEDULED",
  "category": "EXTERNAL",
  "allDay": false,
  "location": "서울 본사",
  "typePrimary": "NDR",
  "typeSecondary": "STRATEGY_MEETING",
  "memo": "<p>정기 IR 미팅 내용</p>",
  "kbs": ["김국민", "이금융"],
  "visitors": ["Morgan Capital", "BlackRock Japan"]
}
```

### Activity Response

```json
{
  "success": true,
  "data": {
    "id": "act-123",
    "title": "정기 IR 미팅",
    "startISO": "2025-10-30T12:00:00.000Z",
    "endISO": "2025-10-30T14:00:00.000Z",
    "status": "SCHEDULED",
    "category": "EXTERNAL",
    "allDay": false,
    "location": "서울 본사",
    "typePrimary": "NDR",
    "typeSecondary": "STRATEGY_MEETING",
    "memo": "<p>정기 IR 미팅 내용</p>",
    "kbs": ["김국민", "이금융"],
    "visitors": ["Morgan Capital", "BlackRock Japan"],
    "keywords": [],
    "attachments": [],
    "subActivities": [],
    "createdAt": "2025-10-29T10:00:00.000Z",
    "updatedAt": "2025-10-29T10:00:00.000Z"
  }
}
```

### Update Status Request

```json
PATCH /api/ir/activities/act-123/status
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

---

## 7. Validation Rules

### Backend Validation Checklist

- [ ] Status must be one of: `"SCHEDULED"`, `"IN_PROGRESS"`, `"COMPLETED"`, `"SUSPENDED"`
- [ ] Category must be one of: `"INTERNAL"`, `"EXTERNAL"`, `"VACATION"`, `"HOLIDAY"`
- [ ] TypePrimary is required (one of: `"NDR"`, `"CONFERENCE_CALL"`, `"SHAREHOLDERS_MEETING"`, `"EARNINGS_ANNOUNCEMENT"`, `"OTHER"`)
- [ ] TypeSecondary is optional (one of: `"STRATEGY_MEETING"`, `"ONE_ON_ONE"`, `"GROUP_MEETING"`, `"OTHER"`)
- [ ] Maximum 50 KB participants (kbs array)
- [ ] Maximum 50 visitors (visitors array)
- [ ] Maximum 5 keywords
- [ ] Maximum 10 file attachments
- [ ] Each file must be ≤ 50MB
- [ ] Total file size must be ≤ 500MB
- [ ] When status changes to `"COMPLETED"`, set `resolvedAt` timestamp

### Error Response Examples

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "최대 50명까지 추가할 수 있습니다",
    "field": "kbs"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "유효하지 않은 상태입니다. 가능한 값: SCHEDULED, IN_PROGRESS, COMPLETED, SUSPENDED",
    "field": "status"
  }
}
```

---

## 8. Migration Guide

### Step 1: Create Common Code Table

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate
```

생성된 마이그레이션은 다음을 수행합니다:
- `common_codes` 테이블 생성
- `ir_activities.status`를 enum에서 varchar(50)로 변경
- `ir_activities.category`를 enum에서 varchar(50)로 변경
- 기존 enum 타입 제거

### Step 2: Seed Common Code Data

```bash
# Run common code seed
npx tsx src/database/seeds/common-code.seed.ts
```

공통코드 데이터가 `common_codes` 테이블에 삽입됩니다:
- IR_ACTIVITY_STATUS (4개)
- IR_ACTIVITY_CATEGORY (4개)
- IR_ACTIVITY_TYPE_PRIMARY (5개)
- IR_ACTIVITY_TYPE_SECONDARY (4개)

### Step 3: Update Backend Code

모든 DTO 파일에서 한글 enum 값을 영어 키로 변경:

```typescript
// Before
status: z.enum(['예정', '진행중', '완료', '중단'])
category: z.enum(['내부', '외부', '휴가', '공휴일'])

// After
status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED'])
category: z.enum(['INTERNAL', 'EXTERNAL', 'VACATION', 'HOLIDAY'])
```

### Step 4: Use Constants

```typescript
// src/ir/constants/ir-activity.constants.ts를 import하여 사용
import {
  IR_ACTIVITY_STATUS,
  IR_ACTIVITY_CATEGORY,
  getStatusLabel,
  getCategoryLabel
} from '@/ir/constants/ir-activity.constants';

// 영어 키 사용
const status = IR_ACTIVITY_STATUS.SCHEDULED;

// UI 표시용 한글 라벨 가져오기
const label = getStatusLabel(status); // "예정"
```

---

## 9. Common Code Table Structure

### Table: `common_codes`

공통코드를 중앙집중식으로 관리하는 테이블입니다.

```sql
CREATE TABLE "common_codes" (
  "code_group" varchar(50) NOT NULL,      -- 코드 그룹
  "code_key" varchar(50) NOT NULL,        -- 코드 키 (영문)
  "code_label" varchar(100) NOT NULL,     -- 코드 라벨 (한글)
  "description" text,                     -- 설명
  "display_order" integer DEFAULT 0,      -- 표시 순서
  "is_active" boolean DEFAULT true,       -- 사용 여부
  "extra_data" text,                      -- 추가 데이터 (JSON)
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  PRIMARY KEY ("code_group", "code_key")
);
```

### Benefits

1. **중앙 관리**: 모든 코드를 한 곳에서 관리
2. **동적 추가**: 코드 추가/수정 시 마이그레이션 불필요
3. **확장성**: `extra_data` 필드로 추가 정보 저장 가능 (예: 색상, 아이콘)
4. **다국어 지원**: `code_label`을 언어별로 확장 가능

### Query Example

```typescript
// 특정 그룹의 모든 코드 조회
const statuses = await db
  .select()
  .from(commonCodes)
  .where(eq(commonCodes.codeGroup, 'IR_ACTIVITY_STATUS'))
  .where(eq(commonCodes.isActive, true))
  .orderBy(commonCodes.displayOrder);

// 결과: [{ codeKey: 'SCHEDULED', codeLabel: '예정', ... }, ...]
```

---

## 10. Notes

- **영어 키 사용**: 모든 enum 값은 API/DB에서 영어 키로 저장됩니다 (예: `"SCHEDULED"`, `"EXTERNAL"`)
- **UI 표시**: 프론트엔드에서는 한글 라벨로 변환하여 표시합니다 (예: `"SCHEDULED"` → `"예정"`)
- **대소문자**: 정확한 대문자 영어 문자열을 사용해야 합니다 (UPPER_SNAKE_CASE)
- **기본값**:
  - `status` 기본값: `"SCHEDULED"`
- **필수 필드**: `status`, `category`, `typePrimary`는 필수
- **선택 필드**: `typeSecondary`는 선택
- **공통코드 관리**: 새로운 코드 추가는 `common_codes` 테이블에 직접 INSERT하거나 seed 파일 수정 후 재실행

---

## 11. Frontend Reference

프론트엔드 구현 참고:
- Constants 파일: `app/features/ir/calendar/model/constants.ts`
- 사용 예시: `app/features/ir/calendar/ui/AddIrActivityModal.tsx`

---

**Last Updated**: 2025-10-29
**Version**: 2.0.0 (공통코드 테이블 방식으로 전환)
