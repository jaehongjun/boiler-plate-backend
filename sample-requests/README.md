# IR API Sample Requests

이 디렉토리에는 IR API를 테스트하기 위한 샘플 요청이 포함되어 있습니다.

## 파일 목록

### 1. `ir-list-view.sh`
Bash 스크립트로 작성된 자동화된 테스트 시나리오입니다.

**사용 방법:**
```bash
# 실행 권한 부여
chmod +x sample-requests/ir-list-view.sh

# 실행
./sample-requests/ir-list-view.sh
```

**필요 조건:**
- `curl`: HTTP 요청 전송
- `jq`: JSON 파싱 및 포맷팅

**설치 (macOS):**
```bash
brew install jq
```

**설치 (Ubuntu/Debian):**
```bash
sudo apt-get install jq
```

**주요 기능:**
- 자동 로그인 및 토큰 획득
- IR 목록 조회 (기본)
- 필터링된 IR 목록 조회 (상태, 카테고리)
- 테이블 형식으로 결과 표시
- 복사 가능한 curl 명령어 예시 제공

### 2. `ir-list-view.postman.json`
Postman 컬렉션 파일입니다.

**사용 방법:**
1. Postman 실행
2. **Import** 버튼 클릭
3. `ir-list-view.postman.json` 파일 선택
4. 컬렉션이 추가되면 환경 변수 설정:
   - `baseUrl`: `http://localhost:8080`
   - `accessToken`: 로그인 후 받은 JWT 토큰

**포함된 요청:**
1. Get List View - Basic (기본 조회)
2. Get List View - With Status Filter (상태 필터)
3. Get List View - With Category Filter (카테고리 필터)
4. Get List View - Multiple Filters (복합 필터)
5. Get List View - Current Month (현재 월)
6. Get List View - Specific Week (특정 주)

## API 엔드포인트

### GET `/api/ir/list/activities`

테이블 형식으로 IR 활동 목록을 조회합니다.

**Query Parameters:**
- `start` (required): 조회 시작 일시 (ISO 8601 format)
- `end` (required): 조회 종료 일시 (ISO 8601 format)
- `status` (optional): 상태 필터 (`예정`, `진행중`, `완료`, `중단`, `전체`)
- `category` (optional): 카테고리 필터 (`내부`, `외부`, `휴가`, `공휴일`)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 샘플 요청 예시

### 1. 기본 조회
```bash
curl -X GET "http://localhost:8080/api/ir/list/activities?start=2025-09-01T00:00:00Z&end=2025-09-30T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 상태 필터링
```bash
curl -X GET "http://localhost:8080/api/ir/list/activities?start=2025-09-01T00:00:00Z&end=2025-09-30T23:59:59Z&status=예정" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 카테고리 필터링
```bash
curl -X GET "http://localhost:8080/api/ir/list/activities?start=2025-09-01T00:00:00Z&end=2025-09-30T23:59:59Z&category=외부" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. 복합 필터링
```bash
curl -X GET "http://localhost:8080/api/ir/list/activities?start=2025-09-01T00:00:00Z&end=2025-09-30T23:59:59Z&status=예정&category=외부" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. jq로 특정 필드만 추출
```bash
curl -X GET "http://localhost:8080/api/ir/list/activities?start=2025-09-01T00:00:00Z&end=2025-09-30T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.data.activities[] | {id, title, typePrimary, owner, startISO}'
```

## 응답 형식

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "act-1727096400000-abc123",
        "title": "한국투자파트너스 펀드 리뷰 미팅",
        "startISO": "2025-09-23T05:00:00.000Z",
        "endISO": "2025-09-23T06:00:00.000Z",
        "typePrimary": "One-on-One",
        "status": "예정",
        "category": "외부",
        "investors": ["도교 인베스트먼트"],
        "brokers": [],
        "kbParticipants": ["도교 인베스트먼트"],
        "owner": "박성호",
        "updatedAtISO": "2025-09-23T05:00:00.000Z"
      }
    ],
    "total": 7
  },
  "message": "List view activities retrieved successfully"
}
```

## 응답 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 활동 고유 ID |
| `title` | string | IR명 (활동명) |
| `startISO` | string | 시작 일시 (ISO 8601) |
| `endISO` | string\|null | 종료 일시 (ISO 8601) |
| `typePrimary` | string | 유형 (One-on-One, Conference Call 등) |
| `status` | string | 상태 (예정, 진행중, 완료, 중단) |
| `category` | string | 카테고리 (내부, 외부, 휴가, 공휴일) |
| `investors` | string[] | 투자자 목록 |
| `brokers` | string[] | 방문자/브로커 목록 |
| `kbParticipants` | string[] | KB 직원 면담자 목록 |
| `owner` | string | 담당자명 |
| `updatedAtISO` | string | 마지막 업데이트 일시 (ISO 8601) |
| `total` | number | 전체 활동 개수 |

## 문제 해결

### 401 Unauthorized
토큰이 만료되었거나 유효하지 않습니다. 다시 로그인하세요.

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### 400 Bad Request
쿼리 파라미터 형식이 잘못되었습니다. ISO 8601 형식을 확인하세요.

**올바른 형식:**
- `2025-09-01T00:00:00Z`
- `2025-09-30T23:59:59.000Z`

### 서버 연결 실패
서버가 실행 중인지 확인하세요:

```bash
npm run start:dev
```

기본 포트: `http://localhost:8080`

## 추가 리소스

- 전체 API 문서: [IR_API_EXAMPLES.md](../IR_API_EXAMPLES.md)
- Swagger UI: http://localhost:8080/docs (개발 모드에서만)
- IR 구현 요약: [IR_IMPLEMENTATION_SUMMARY.md](../IR_IMPLEMENTATION_SUMMARY.md)
