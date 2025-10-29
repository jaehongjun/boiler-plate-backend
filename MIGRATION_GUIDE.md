# Legacy Data Migration Guide

## Overview

기존 IR Activity 데이터의 한글 값을 영어 키로 변경하는 마이그레이션 가이드입니다.

## 변경 내용

### Status (상태)
- `예정` → `SCHEDULED`
- `진행중` → `IN_PROGRESS`
- `완료` → `COMPLETED`
- `중단` → `SUSPENDED`

### Category (카테고리)
- `내부` → `INTERNAL`
- `외부` → `EXTERNAL`
- `휴가` → `VACATION`
- `공휴일` → `HOLIDAY`

## 실행 방법

### ⚠️ 주의사항

**반드시 데이터베이스 백업을 먼저 수행하세요!**

```bash
# PostgreSQL 백업 (Supabase 사용 시 Dashboard에서 백업)
pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 방법 1: TypeScript 스크립트 실행 (권장)

자동으로 변경 전후 상태를 확인하고 검증까지 수행합니다.

```bash
npm run db:migrate-legacy
```

**출력 예시:**
```
🔄 Starting Legacy Data Migration...

📊 Before Migration:
  ir_activities: [
    { status: '예정', category: '외부', count: 10 }
  ]

🔄 Updating ir_activities.status...
  ✅ Updated 10 rows
🔄 Updating ir_activities.category...
  ✅ Updated 10 rows
🔄 Updating ir_sub_activities.status...
  ✅ Updated 5 rows
🔄 Updating ir_sub_activities.category...
  ✅ Updated 2 rows

📊 After Migration:
  ir_activities: [
    { status: 'SCHEDULED', category: 'EXTERNAL', count: 10 }
  ]

🔍 Checking for remaining legacy values...
  ✅ No legacy values found - migration successful!

✅ Legacy Data Migration Completed!
```

### 방법 2: SQL 직접 실행

더 세밀한 제어가 필요한 경우 SQL 파일을 직접 실행합니다.

```bash
# psql 사용
psql $DATABASE_URL -f src/database/migrations/migrate-legacy-data.sql

# 또는 파일 내용 복사하여 pgAdmin/Supabase SQL Editor에서 실행
```

## 실행 후 검증

마이그레이션 후 다음을 확인하세요:

### 1. 데이터 확인

```sql
-- ir_activities 상태 확인
SELECT status, COUNT(*) as count
FROM ir_activities
GROUP BY status
ORDER BY status;

-- 예상 결과: SCHEDULED, IN_PROGRESS, COMPLETED, SUSPENDED

-- ir_activities 카테고리 확인
SELECT category, COUNT(*) as count
FROM ir_activities
GROUP BY category
ORDER BY category;

-- 예상 결과: INTERNAL, EXTERNAL, VACATION, HOLIDAY
```

### 2. 한글 값 잔존 확인

```sql
-- 한글 값이 남아있는지 확인 (결과가 0이어야 함)
SELECT COUNT(*) as legacy_count
FROM ir_activities
WHERE status IN ('예정', '진행중', '완료', '중단')
   OR category IN ('내부', '외부', '휴가', '공휴일');

-- 예상 결과: 0
```

### 3. API 테스트

```bash
# 서버 재시작
npm run start:dev

# API 호출 테스트
curl http://localhost:3000/api/ir/activities
```

## 롤백 방법

문제가 발생한 경우:

### 방법 1: 백업 복구

```bash
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

### 방법 2: SQL로 역변환

```sql
-- 영어 키를 다시 한글로 변경 (권장하지 않음)
UPDATE ir_activities
SET status = CASE
  WHEN status = 'SCHEDULED' THEN '예정'
  WHEN status = 'IN_PROGRESS' THEN '진행중'
  WHEN status = 'COMPLETED' THEN '완료'
  WHEN status = 'SUSPENDED' THEN '중단'
  ELSE status
END
WHERE status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED');

-- category도 동일하게 처리
```

## 트러블슈팅

### 문제: "foreign key constraint" 에러

**원인**: 다른 테이블에서 status/category를 참조하고 있는 경우

**해결**:
1. 참조하는 테이블도 함께 업데이트
2. 또는 foreign key constraint를 일시적으로 비활성화

### 문제: "column does not exist" 에러

**원인**: 스키마 마이그레이션이 완료되지 않음

**해결**:
```bash
npm run db:migrate
```

### 문제: TypeScript 스크립트가 실행되지 않음

**원인**: tsx가 설치되지 않음

**해결**:
```bash
npm install -g tsx
# 또는
npx tsx src/database/scripts/migrate-legacy-data.ts
```

## 체크리스트

마이그레이션 전:
- [ ] 데이터베이스 백업 완료
- [ ] 스키마 마이그레이션 완료 (`npm run db:migrate`)
- [ ] 공통코드 시드 데이터 삽입 완료 (`npm run db:seed:common-code`)
- [ ] 개발/스테이징 환경에서 먼저 테스트

마이그레이션 실행:
- [ ] `npm run db:migrate-legacy` 실행
- [ ] 출력 로그 확인 (업데이트된 row 수 확인)

마이그레이션 후:
- [ ] SQL로 데이터 검증
- [ ] 한글 값 잔존 여부 확인
- [ ] API 테스트
- [ ] 프론트엔드 연동 테스트

## 참고 문서

- [IR_ACTIVITY_CONSTANTS.md](./IR_ACTIVITY_CONSTANTS.md) - 상수 정의 및 사용법
- [src/ir/constants/ir-activity.constants.ts](./src/ir/constants/ir-activity.constants.ts) - TypeScript 상수
- [src/database/schemas/common-code.schema.ts](./src/database/schemas/common-code.schema.ts) - 공통코드 스키마

---

**Last Updated**: 2025-10-29
