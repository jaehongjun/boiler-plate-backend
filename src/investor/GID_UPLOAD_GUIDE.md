# GID 업로드 API 사용 가이드

GID (Global Investor Data) 업로드 기능을 통해 Excel 또는 CSV 파일로 투자자 데이터를 일괄 등록/업데이트할 수 있습니다.

## 🎯 주요 기능

- ✅ **Excel/CSV 파일 업로드** - xlsx, xls, csv 형식 지원
- ✅ **자동 파싱** - 다양한 컬럼명 변형 자동 인식
- ✅ **모회사/자회사 그룹핑** - Rank 기반 자동 그룹핑
- ✅ **3가지 처리 모드** - UPSERT, REPLACE, APPEND
- ✅ **히스토리 추적** - 변경점 자동 기록
- ✅ **에러 처리** - 행별 에러 추적 및 보고

## 📋 API 엔드포인트

### 1. 파일 업로드
```
POST /api/gid/uploads
Content-Type: multipart/form-data
```

**Request Body**:
```
file: [File]          # Excel 또는 CSV 파일 (필수, 최대 10MB)
year: number          # 년도 (필수)
quarter: number       # 분기 1-4 (필수)
description: string   # 설명 (선택)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "originalFilename": "gid_upload_sample.xlsx",
    "status": "PENDING",
    "meta": {
      "totalRows": 14,
      "columns": ["Rank", "Country", ...],
      "fileSize": 8432,
      "year": 2024,
      "quarter": 4
    },
    "uploadedAt": "2024-10-28T13:00:00Z"
  }
}
```

### 2. 배치 처리
```
POST /api/gid/uploads/:id/process
```

**Request Body**:
```json
{
  "mode": "UPSERT"  // "UPSERT" | "REPLACE" | "APPEND"
}
```

**처리 모드 설명**:
- `UPSERT` (기본): 기존 데이터 업데이트 + 새 데이터 삽입
  - 동일한 투자자명이 있으면 스냅샷 업데이트
  - 없으면 새로 생성
  - 변경 사항은 히스토리에 자동 기록

- `REPLACE`: 기존 스냅샷 전체 삭제 후 교체
  - 해당 연도/분기의 모든 스냅샷 삭제
  - 업로드 파일 데이터로 완전히 교체
  - ⚠️ 주의: 기존 데이터 영구 삭제

- `APPEND`: 새 데이터만 추가
  - 기존 데이터는 유지
  - 중복되는 투자자는 무시

**Response**:
```json
{
  "success": true,
  "data": {
    "uploadBatchId": 1,
    "status": "PROCESSED",
    "result": {
      "totalRows": 14,
      "parsedRows": 14,
      "failedRows": 0,
      "createdInvestors": 10,
      "createdSnapshots": 14,
      "updatedSnapshots": 0,
      "historyRecords": 0
    },
    "errors": []
  }
}
```

### 3. 배치 정보 조회
```
GET /api/gid/uploads/:id
```

### 4. 업로드 행 조회
```
GET /api/gid/uploads/:id/rows?page=1&pageSize=100&onlyErrors=true
```

## 📊 파일 형식

### CSV 예시
```csv
Rank,Country,City,Investor Name,S/O,ORD,ADR,Investor Type,Style Tag,Style Note,Turnover,Orientation,Last Activity At
1,JP,도쿄,BlackRock Investment,80,40,50,INVESTMENT_ADVISOR,POSITIVE,긍정적,MEDIUM,ACTIVE,2025-09-23T14:00:00Z
,JP,도쿄,BlackRock Japan Investment,80,40,50,INVESTMENT_ADVISOR,QUESTION_HEAVY,질문 많음,HIGH,INACTIVE,2025-09-23T14:00:00Z
```

### 필수 컬럼
- **Investor Name** (필수)

### 선택 컬럼
- Rank, Country, City, S/O, ORD, ADR, Investor Type, Style Tag, Style Note, Turnover, Orientation, Last Activity At

## 🔄 워크플로우

### 일반적인 사용 시나리오

#### 시나리오 1: 분기별 신규 데이터 업로드
```bash
# 1. 파일 업로드
curl -X POST http://localhost:3000/api/gid/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@data_2024_q4.xlsx" \
  -F "year=2024" \
  -F "quarter=4"

# Response: { "data": { "id": 123 } }

# 2. UPSERT 모드로 처리 (기본)
curl -X POST http://localhost:3000/api/gid/uploads/123/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "mode": "UPSERT" }'

# 3. 결과 확인
curl http://localhost:3000/api/gid/uploads/123 \
  -H "Authorization: Bearer $TOKEN"

# 4. 에러 확인 (있을 경우)
curl http://localhost:3000/api/gid/uploads/123/rows?onlyErrors=true \
  -H "Authorization: Bearer $TOKEN"

# 5. 생성된 스냅샷 확인
curl http://localhost:3000/api/investors/table?year=2024&quarter=4 \
  -H "Authorization: Bearer $TOKEN"
```

#### 시나리오 2: 데이터 전체 교체
```bash
# 기존 2024 Q4 데이터를 완전히 새 파일로 교체
curl -X POST http://localhost:3000/api/gid/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@new_data_2024_q4.xlsx" \
  -F "year=2024" \
  -F "quarter=4"

# REPLACE 모드로 처리
curl -X POST http://localhost:3000/api/gid/uploads/124/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "mode": "REPLACE" }'
```

#### 시나리오 3: 추가 데이터만 삽입
```bash
# 기존 데이터는 유지하고 새 투자자만 추가
curl -X POST http://localhost:3000/api/gid/uploads/125/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "mode": "APPEND" }'
```

## 🔍 데이터 매핑 규칙

### 모회사/자회사 자동 그룹핑

```csv
Rank,Investor Name
1,BlackRock Investment          ← 모회사 (Rank 있음)
,BlackRock Japan Investment     ← 자회사 (Rank 없음)
,BlackRock Japan II             ← 자회사 (Rank 없음)
2,Fidelity Asset Management     ← 모회사 (Rank 있음)
,Fidelity HK Limited            ← 자회사 (Rank 없음)
```

**규칙**:
- Rank 컬럼에 숫자가 있으면 → 모회사 (`isGroupRepresentative: true`)
- Rank 컬럼이 비어있으면 → 자회사 (`parentId: 이전 모회사 ID`)

### 국가 코드 자동 생성

존재하지 않는 국가 코드를 사용하면 자동으로 `countries` 테이블에 추가됩니다:

```typescript
// 입력: Country = "SG"
// countries 테이블에 SG가 없으면:
// → INSERT INTO countries VALUES ('SG', 'SG', 'SG')
```

### 컬럼명 유연성

다양한 컬럼명 변형을 자동 인식:
- `Investor Name`, `investor_name`, `INVESTOR NAME` → 모두 동일하게 인식
- `S/O`, `s/o`, `SOverO` → 모두 동일하게 인식

## ⚠️ 주의사항 및 제약사항

### 파일 제약
- **최대 파일 크기**: 10MB
- **지원 형식**: `.xlsx`, `.xls`, `.csv`
- **권장 행 수**: 1,000행 이하

### 데이터 제약
- **Investor Name은 필수**
- 중복된 투자자명은 동일한 투자자로 간주
- 숫자 필드는 자동 파싱 (실패 시 null)

### 성능 고려사항
- 대량 데이터 업로드 시 `APPEND` 모드 권장
- 배치 처리는 최대 수 분 소요 가능
- 동시 업로드 제한 없음 (각 배치는 독립적으로 처리)

### 히스토리 기록
- `UPSERT` 모드만 히스토리 자동 생성
- `REPLACE`, `APPEND` 모드는 히스토리 미생성

## 🐛 에러 처리

### 일반적인 에러

#### 1. 파일 형식 오류
```json
{
  "success": false,
  "message": "Invalid file type. Only CSV and Excel files are allowed."
}
```

#### 2. 필수 필드 누락
```json
{
  "data": {
    "errors": [
      {
        "row": 5,
        "message": "Investor Name is required",
        "data": { "Rank": "5", "Country": "JP" }
      }
    ]
  }
}
```

#### 3. 배치 이미 처리됨
```json
{
  "success": false,
  "message": "Batch already processed"
}
```

### 에러 복구 전략

1. **부분 실패 시**:
   - `onlyErrors=true`로 실패한 행만 조회
   - 해당 행만 수정하여 새 파일로 재업로드
   - `APPEND` 모드로 재처리

2. **전체 실패 시**:
   - 원본 파일 검증 (필수 컬럼, 형식 확인)
   - 샘플 데이터로 테스트
   - 수정 후 재업로드

## 📈 모니터링

### 배치 상태 확인
```bash
# 배치 정보 조회
GET /api/gid/uploads/:id

# 응답의 status 필드:
# - PENDING: 업로드 완료, 처리 대기 중
# - PROCESSED: 처리 완료
# - FAILED: 처리 실패
```

### 처리 결과 모니터링
```typescript
const result = await processUploadBatch(...);

console.log(`총 행수: ${result.result.totalRows}`);
console.log(`성공: ${result.result.parsedRows}`);
console.log(`실패: ${result.result.failedRows}`);
console.log(`생성된 투자자: ${result.result.createdInvestors}`);
console.log(`생성된 스냅샷: ${result.result.createdSnapshots}`);
console.log(`업데이트된 스냅샷: ${result.result.updatedSnapshots}`);
console.log(`히스토리 기록: ${result.result.historyRecords}`);
```

## 🧪 샘플 파일

샘플 파일 위치:
- **CSV**: `samples/gid_upload_sample.csv`
- **Excel**: `samples/gid_upload_sample.xlsx`

샘플 파일 생성:
```bash
npx tsx samples/generate-excel-sample.ts
```

---

**버전**: 1.0.0
**최종 수정**: 2024-10-28
