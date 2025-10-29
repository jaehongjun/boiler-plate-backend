-- ============================================
-- Legacy Data Migration Script
-- IR Activity 한글 값을 영어 키로 변경
-- ============================================

-- 실행 전 백업 필수!
-- pg_dump your_database > backup_before_migration.sql

BEGIN;

-- ============================================
-- 1. ir_activities 테이블 업데이트
-- ============================================

-- Status 변경
UPDATE ir_activities
SET status = CASE
  WHEN status = '예정' THEN 'SCHEDULED'
  WHEN status = '진행중' THEN 'IN_PROGRESS'
  WHEN status = '완료' THEN 'COMPLETED'
  WHEN status = '중단' THEN 'SUSPENDED'
  ELSE status
END
WHERE status IN ('예정', '진행중', '완료', '중단');

-- Category 변경
UPDATE ir_activities
SET category = CASE
  WHEN category = '내부' THEN 'INTERNAL'
  WHEN category = '외부' THEN 'EXTERNAL'
  WHEN category = '휴가' THEN 'VACATION'
  WHEN category = '공휴일' THEN 'HOLIDAY'
  ELSE category
END
WHERE category IN ('내부', '외부', '휴가', '공휴일');

-- ============================================
-- 2. ir_sub_activities 테이블 업데이트
-- ============================================

-- Status 변경
UPDATE ir_sub_activities
SET status = CASE
  WHEN status = '예정' THEN 'SCHEDULED'
  WHEN status = '진행중' THEN 'IN_PROGRESS'
  WHEN status = '완료' THEN 'COMPLETED'
  WHEN status = '중단' THEN 'SUSPENDED'
  ELSE status
END
WHERE status IN ('예정', '진행중', '완료', '중단');

-- Category 변경 (nullable이므로 NULL 체크)
UPDATE ir_sub_activities
SET category = CASE
  WHEN category = '내부' THEN 'INTERNAL'
  WHEN category = '외부' THEN 'EXTERNAL'
  WHEN category = '휴가' THEN 'VACATION'
  WHEN category = '공휴일' THEN 'HOLIDAY'
  ELSE category
END
WHERE category IN ('내부', '외부', '휴가', '공휴일');

-- ============================================
-- 3. 검증 쿼리 (변경 결과 확인)
-- ============================================

-- ir_activities의 status 분포 확인
SELECT status, COUNT(*) as count
FROM ir_activities
GROUP BY status
ORDER BY status;

-- ir_activities의 category 분포 확인
SELECT category, COUNT(*) as count
FROM ir_activities
GROUP BY category
ORDER BY category;

-- ir_sub_activities의 status 분포 확인
SELECT status, COUNT(*) as count
FROM ir_sub_activities
GROUP BY status
ORDER BY status;

-- ir_sub_activities의 category 분포 확인
SELECT category, COUNT(*) as count
FROM ir_sub_activities
GROUP BY category
ORDER BY category;

-- 한글 값이 남아있는지 확인 (이 쿼리 결과가 0이어야 함)
SELECT
  'ir_activities' as table_name,
  COUNT(*) as legacy_status_count
FROM ir_activities
WHERE status IN ('예정', '진행중', '완료', '중단')
UNION ALL
SELECT
  'ir_activities' as table_name,
  COUNT(*) as legacy_category_count
FROM ir_activities
WHERE category IN ('내부', '외부', '휴가', '공휴일')
UNION ALL
SELECT
  'ir_sub_activities' as table_name,
  COUNT(*) as legacy_status_count
FROM ir_sub_activities
WHERE status IN ('예정', '진행중', '완료', '중단')
UNION ALL
SELECT
  'ir_sub_activities' as table_name,
  COUNT(*) as legacy_category_count
FROM ir_sub_activities
WHERE category IN ('내부', '외부', '휴가', '공휴일');

-- 문제가 없으면 COMMIT, 문제가 있으면 ROLLBACK
-- ROLLBACK; -- 롤백하려면 이 라인 주석 해제
COMMIT;
