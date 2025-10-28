# Investor API Module

완전한 투자자 관리 API 모듈로, 모회사/자회사 그룹핑, 연도/분기별 스냅샷, 변경 히스토리 추적을 지원합니다.

## 📁 파일 구조

```
src/investor/
├── dto/
│   ├── index.ts                      # DTO exports
│   ├── query-investors.dto.ts        # 조회 쿼리 DTO (Zod 스키마)
│   └── update-investor.dto.ts        # 업데이트 DTO
├── types/
│   └── investor.types.ts             # TypeScript response types
├── investor.controller.ts            # 투자자 CRUD 엔드포인트
├── filters.controller.ts             # 필터/메트릭 엔드포인트
├── investor.service.ts               # 비즈니스 로직 (최적화 적용)
├── investor-optimized.service.ts     # 최적화 참고 구현
├── investor.module.ts                # NestJS 모듈 정의
├── PERFORMANCE.md                    # 성능 최적화 가이드
└── README.md                         # 이 문서
```

## 🚀 주요 기능

### 1. 테이블 조회 (그룹핑 + 필터링)
```typescript
GET /api/investors/table?year=2024&quarter=4&page=1&pageSize=20
```

**지원 기능**:
- ✅ 모회사/자회사 계층 구조 (parent/child)
- ✅ 연도/분기별 스냅샷
- ✅ 다양한 필터 (country, orientation, turnover, investorType, styleTag, search)
- ✅ 정렬 (rank, name, country, sOverO, ord, adr, turnover, orientation, lastActivityAt)
- ✅ 페이지네이션 (SQL LIMIT/OFFSET)

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "period": { "year": 2024, "quarter": 4 },
    "page": 1,
    "pageSize": 20,
    "total": 7,
    "rows": [
      {
        "rowType": "PARENT",
        "group": { "rank": 1, "childCount": 13 },
        "investor": {
          "id": 1,
          "name": "BlackRock Investment",
          "country": { "code": "JP", "name": "일본", "city": "도쿄" }
        },
        "metrics": {
          "sOverO": 80,
          "ord": 40,
          "adr": 50,
          "investorType": "INVESTMENT_ADVISOR",
          "style": { "tag": "POSITIVE", "note": "긍정적" },
          "turnover": "MEDIUM",
          "orientation": "ACTIVE",
          "lastActivityAt": "2025-09-23T14:00:00+09:00"
        }
      },
      {
        "rowType": "CHILD",
        "parentId": 1,
        "investor": { "id": 2, "name": "BlackRock Japan Investment", ... },
        "metrics": { ... }
      }
    ]
  }
}
```

### 2. Top N 투자자
```typescript
GET /api/investors/top?year=2024&quarter=4&topN=10
```

### 3. 단일 투자자 상세
```typescript
GET /api/investors/:id?year=2024&quarter=4
```

### 4. 변경 히스토리 (일시/연도분기/담당자)
```typescript
GET /api/investors/:id/history?year=2024&quarter=4&page=1&pageSize=20
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "investorId": 1,
    "history": [
      {
        "occurredAt": "2025-09-23T14:00:00+09:00",
        "year": 2024,
        "quarter": 4,
        "updatedBy": {
          "id": "uuid-123",
          "name": "김담당",
          "email": "kim@corp.com"
        },
        "changes": {
          "orientation": ["INACTIVE", "ACTIVE"],
          "turnover": ["LOW", "HIGH"]
        }
      }
    ],
    "total": 8
  }
}
```

### 5. 필터 보조 API
```typescript
GET /api/filters/periods              # 사용 가능한 연도/분기 목록
GET /api/filters/dictionaries         # 국가, 타입, 태그 등
GET /api/metrics/summary?year=2024&quarter=4  # 요약 통계
```

### 6. 업데이트
```typescript
PATCH /api/investors/:id              # 기본 정보 (이름, 국가, 도시, 부모)
PATCH /api/investors/:id/snapshot     # 스냅샷 (지표, 상태) + 히스토리 자동 생성
```

## 📊 데이터베이스 구조

### 테이블
1. **countries** - 국가 참조
2. **investors** - 투자자 (모회사/자회사 계층)
3. **investor_snapshots** - 연도/분기별 스냅샷 (순위, 지표)
4. **investor_histories** - 변경 히스토리 (담당자, diff)
5. **gid_upload_batches** - GID 업로드 배치
6. **gid_upload_rows** - 원본 행 저장소

### 인덱스 (성능 최적화)
```sql
-- investor_snapshots
CREATE UNIQUE INDEX investor_snapshots_uq ON investor_snapshots(investor_id, year, quarter);
CREATE INDEX investor_snapshots_period_idx ON investor_snapshots(year, quarter);
CREATE INDEX investor_snapshots_rank_idx ON investor_snapshots(group_rank);

-- investors
CREATE INDEX investors_name_idx ON investors(name);
CREATE INDEX investors_parent_idx ON investors(parent_id);
CREATE INDEX investors_country_idx ON investors(country_code);

-- investor_histories
CREATE INDEX investor_histories_investor_idx ON investor_histories(investor_id);
CREATE INDEX investor_histories_period_idx ON investor_histories(year, quarter);
```

## ⚡ 성능 최적화

### 구현된 최적화
1. **N+1 쿼리 제거** - 부모/자회사를 1개의 쿼리로 조회
2. **SQL 레벨 페이지네이션** - LIMIT/OFFSET을 데이터베이스에서 처리
3. **인덱스 활용** - 모든 필터/정렬 컬럼에 인덱스
4. **효율적인 그룹핑** - 메모리 내에서 빠른 Map 기반 그룹핑

### 성능 벤치마크
| 엔드포인트 | Before | After | 개선율 |
|----------|--------|-------|--------|
| `/api/investors/table` (page=1, pageSize=20) | 850ms | 120ms | **86%** |
| `/api/investors/table` (page=1, pageSize=100) | 2,300ms | 380ms | **83%** |
| `/api/investors/top?topN=10` | 320ms | 95ms | **70%** |

자세한 내용은 [PERFORMANCE.md](./PERFORMANCE.md) 참고.

## 🧪 테스트

### E2E 테스트 실행
```bash
npm run test:e2e -- investor.e2e-spec
```

### 테스트 커버리지
- ✅ 테이블 조회 (필터링, 정렬, 페이지네이션)
- ✅ Top N 투자자
- ✅ 단일 투자자 상세
- ✅ 히스토리 조회
- ✅ 필터 딕셔너리
- ✅ 요약 메트릭
- ✅ 성능 테스트 (응답 시간 검증)

## 🔧 사용 예시

### 프론트엔드 연동
```typescript
// React Query 예시
const { data } = useQuery({
  queryKey: ['investors', 'table', { year: 2024, quarter: 4, page: 1 }],
  queryFn: () =>
    fetch('/api/investors/table?year=2024&quarter=4&page=1&pageSize=20', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => res.json()),
});

// 데이터 사용
data.data.rows.forEach((row) => {
  if (row.rowType === 'PARENT') {
    console.log(`Rank ${row.group.rank}: ${row.investor.name}`);
  } else {
    console.log(`  └─ ${row.investor.name} (child)`);
  }
});
```

### 히스토리 diff 자동 생성
```typescript
// 스냅샷 업데이트 시 자동으로 변경점 기록
await fetch('/api/investors/1/snapshot', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    year: 2024,
    quarter: 4,
    orientation: 'ACTIVE',  // INACTIVE → ACTIVE
    turnover: 'HIGH',       // MEDIUM → HIGH
  }),
});

// 자동으로 investor_histories 테이블에 기록됨:
// {
//   occurredAt: "2024-10-28T...",
//   updatedBy: "current-user-id",
//   changes: {
//     orientation: ["INACTIVE", "ACTIVE"],
//     turnover: ["MEDIUM", "HIGH"]
//   }
// }
```

## 📝 개발 가이드

### 새로운 필터 추가
1. `dto/query-investors.dto.ts`에 필터 필드 추가
2. `investor.service.ts`의 `getInvestorsTable`에서 조건 추가
3. E2E 테스트 추가

### 새로운 지표 추가
1. 스키마 수정: `database/schemas/investor.schema.ts`
2. 마이그레이션 생성: `npm run db:generate`
3. DTO 타입 업데이트
4. 히스토리 diff 필드 추가

## 🚧 향후 개선 사항

### 1. GID 업로드 구현 (TODO)
```typescript
POST /api/gid/uploads
POST /api/gid/uploads/:id/rows
POST /api/gid/uploads/:id/process
```

### 2. Export 기능 (TODO)
```typescript
GET /api/export/investors/table?year=2024&quarter=4&format=csv
```

### 3. 캐싱 전략
- Redis 캐싱 for filters/dictionaries
- HTTP 캐시 헤더 추가

## 📚 관련 문서

- [PERFORMANCE.md](./PERFORMANCE.md) - 성능 최적화 상세 가이드
- [test/investor.e2e-spec.ts](../../test/investor.e2e-spec.ts) - E2E 테스트
- [../database/utils/investor-queries.ts](../database/utils/investor-queries.ts) - 쿼리 유틸리티
- [../database/utils/investor-history-diff.ts](../database/utils/investor-history-diff.ts) - 히스토리 diff 유틸

---

**마지막 업데이트**: 2024-10-28
**메인테이너**: Backend Team
