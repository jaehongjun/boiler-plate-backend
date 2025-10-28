# 투자자 상세 페이지 API 스펙

## 개요

투자자 상세 정보를 조회하는 API 스펙입니다.

## 엔드포인트

### 투자자 상세 조회

```
GET /api/investors/{id}
```

자동으로 최신 분기 데이터를 조회합니다.

#### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|-----|------|
| id | number | O | 투자자 ID |

#### Query Parameters

없음 (자동으로 최신 분기 데이터 조회)

#### Response (200 OK)

```typescript
{
  // 기본 정보
  id: string;                    // 투자자 ID
  rank: string;                  // 순위 (예: "#5")
  companyName: string;           // 회사명
  country: {
    name: string;                // 국가명 (한글)
    city: string;                // 도시명 (한글)
    code: string;                // 국가 코드 (ISO 3166-1 alpha-2, 예: "FR", "US", "JP")
  };
  style: string;                 // 스타일 (예: "긍정적", "질문 많음", "까칠함")
  type: string;                  // 타입 (예: "성장형", "가치형")
  turnover: "High" | "Medium" | "Low";      // 회전율
  orientation: "Active" | "Inactive";       // 운용방식

  // 메트릭 카드 (4개)
  metrics: [
    {
      label: string;             // 라벨 (예: "% S/O", "ORD", "ADR", "ORD + ADR")
      value: string;             // 값 (예: "70.1%", "132,675")
      change: string;            // 변화 설명 (예: "지난 분기 대비 +10%")
      iconType: "trending-up" | "bar-chart" | "pie-chart" | "star";
    }
  ];

  // 보유주식수 추이 차트
  stockHoldingsChart: {
    title: string;               // 차트 제목 (예: "보유주식수 추이")
    subtitle: string;            // 부제목 (예: "지난 분기 대비 +3.5% 상승")
    data: [
      {
        quarter: string;         // 분기 (예: "1Q22", "2Q22")
        value: number;           // 보유 주식수
        rate?: number;           // 증가율 (%) (예: 2.8)
      }
    ];
    highlightedQuarters?: string[];  // 강조할 분기 (예: ["3Q24", "4Q24"])
  };

  // 지분 추이 차트
  stakeChart: {
    title: string;               // 차트 제목 (예: "지분 추이")
    subtitle: string;            // 부제목 (예: "전년 동기 대비 +3.5% 상승")
    data: [
      {
        quarter: string;         // 분기
        value: number;           // 지분 값
        rate?: number;           // 비율 (%)
      }
    ];
    highlightedQuarters?: string[];  // 강조할 분기
  };

  // 면담 이력
  meetingHistory: [
    {
      id: string;                // 면담 ID
      date: string;              // 날짜 (YYYY.MM.DD 형식)
      time: string;              // 시간 (HH:MM 형식)
      type: string;              // 유형 (예: "One-on-One", "NDR")
      format: string;            // 형식 (예: "비대면", "CEO, 비대면, IR비대면")
      participants: string;      // 참석자 (예: "John", "Harold, Rahul")
      topics: string[];          // 논의 주제 (예: ["영업현황", "수주현황", "CETI 매출"])
      stakeChange: string;       // 지분 변화 (예: "+5.2%", "-5.2%")
      shareChange: string;       // 주식수 변화
      bookmarked: boolean;       // 북마크 여부
    }
  ];

  // 관심사 주제 (향후 버블 차트 사용 예정)
  interests: [
    {
      id: string;                // 주제 ID
      name: string;              // 주제명 (예: "주주환원", "경영권")
      weight: number;            // 가중치 (크기 결정용)
    }
  ];

  // 활동 타임라인 (향후 구현 예정)
  activities: [
    {
      id: string;                // 활동 ID
      date: string;              // 날짜 (YYYY.MM.DD)
      type: string;              // 활동 타입
      participants: string;      // 참여자 또는 설명
      tags: string[];            // 관련 태그
      stakeChange: string;       // 지분 변화
      shareChange: string;       // 주식수 변화
      bookmarked: boolean;       // 북마크 여부
    }
  ];

  // 커뮤니케이션 프로젝트 (향후 구현 예정)
  communications: [
    {
      quarter: string;           // 분기 (예: "1Q25")
      type: string;              // 타입 (예: "대면미팅", "비대면미팅")
      details: [
        {
          name: string;          // 상세 이름
          values: string[];      // 값 목록
        }
      ];
    }
  ];
}
```

## Response Example

```json
{
  "id": "5",
  "rank": "#5",
  "companyName": "BlackRock Investment",
  "country": {
    "name": "France",
    "city": "Paris",
    "code": "FR"
  },
  "style": "긍정적",
  "type": "성장형",
  "turnover": "Low",
  "orientation": "Active",
  "metrics": [
    {
      "label": "% S/O",
      "value": "70.1%",
      "change": "지난 분기 대비 +10%",
      "iconType": "trending-up"
    },
    {
      "label": "ORD",
      "value": "132,675",
      "change": "지난 분기 대비 +10%",
      "iconType": "bar-chart"
    },
    {
      "label": "ADR",
      "value": "169,522",
      "change": "지난 분기 대비 +20%",
      "iconType": "pie-chart"
    },
    {
      "label": "ORD + ADR",
      "value": "179,777",
      "change": "지난 분기 대비 +20%",
      "iconType": "star"
    }
  ],
  "stockHoldingsChart": {
    "title": "보유주식수 추이",
    "subtitle": "지난 분기 대비 +3.5% 상승",
    "data": [
      { "quarter": "1Q22", "value": 500, "rate": 2.8 },
      { "quarter": "2Q22", "value": 600, "rate": 2.8 },
      { "quarter": "3Q22", "value": 800, "rate": 2.8 },
      { "quarter": "4Q22", "value": 900, "rate": 2.8 },
      { "quarter": "1Q23", "value": 1100, "rate": 2.8 },
      { "quarter": "2Q23", "value": 1200, "rate": 2.8 },
      { "quarter": "3Q23", "value": 1400, "rate": 2.8 },
      { "quarter": "4Q23", "value": 1600, "rate": 2.8 },
      { "quarter": "1Q24", "value": 1200, "rate": 2.8 },
      { "quarter": "2Q24", "value": 1000, "rate": 2.8 },
      { "quarter": "3Q24", "value": 1400, "rate": 2.8 },
      { "quarter": "4Q24", "value": 1700, "rate": 2.8 }
    ],
    "highlightedQuarters": ["3Q24", "4Q24"]
  },
  "stakeChart": {
    "title": "지분 추이",
    "subtitle": "전년 동기 대비 +3.5% 상승",
    "data": [
      { "quarter": "1Q22", "value": 500, "rate": 2.1 },
      { "quarter": "2Q22", "value": 600, "rate": 2.25 },
      { "quarter": "3Q22", "value": 800, "rate": 2.8 },
      { "quarter": "4Q22", "value": 900, "rate": 2.8 },
      { "quarter": "1Q23", "value": 1100, "rate": 2.8 },
      { "quarter": "2Q23", "value": 1200, "rate": 2.8 },
      { "quarter": "3Q23", "value": 1400, "rate": 2.8 },
      { "quarter": "4Q23", "value": 1600, "rate": 2.8 },
      { "quarter": "1Q24", "value": 1200, "rate": 2.8 },
      { "quarter": "2Q24", "value": 1000, "rate": 2.8 },
      { "quarter": "3Q24", "value": 1400, "rate": 2.8 },
      { "quarter": "4Q24", "value": 1700, "rate": 2.8 }
    ],
    "highlightedQuarters": []
  },
  "meetingHistory": [
    {
      "id": "1",
      "date": "25.09.25",
      "time": "14:00",
      "type": "One-on-One",
      "format": "비대면",
      "participants": "John",
      "topics": ["영업현황", "수주현황", "CETI 매출"],
      "stakeChange": "+5.2%",
      "shareChange": "+5.2%",
      "bookmarked": false
    },
    {
      "id": "2",
      "date": "25.09.25",
      "time": "14:00",
      "type": "NDR",
      "format": "CEO, 비대면, IR비대면",
      "participants": "Harold, Rahul",
      "topics": ["영업현황", "수주현황", "CETI 매출"],
      "stakeChange": "-5.2%",
      "shareChange": "-5.2%",
      "bookmarked": false
    },
    {
      "id": "3",
      "date": "25.09.25",
      "time": "14:00",
      "type": "One-on-One",
      "format": "CEO, 비대면, IR비대면",
      "participants": "John",
      "topics": ["영업현황", "CETI 매출"],
      "stakeChange": "+5.2%",
      "shareChange": "-5.2%",
      "bookmarked": false
    }
  ],
  "interests": [
    { "id": "1", "name": "주주환원", "weight": 100 },
    { "id": "2", "name": "탑직 리스크", "weight": 60 },
    { "id": "3", "name": "경영권", "weight": 80 },
    { "id": "4", "name": "성장성", "weight": 90 },
    { "id": "5", "name": "자본비용", "weight": 50 },
    { "id": "6", "name": "수익성", "weight": 110 },
    { "id": "7", "name": "일반 관리비", "weight": 70 }
  ],
  "activities": [
    {
      "id": "1",
      "date": "25.09.25",
      "type": "One-on-One",
      "participants": "SQ 실적 취약",
      "tags": ["영업현황", "수주현황", "CETI 매출"],
      "stakeChange": "+1.2%",
      "shareChange": "+5.2%",
      "bookmarked": true
    },
    {
      "id": "2",
      "date": "25.09.25",
      "type": "NDR",
      "participants": "신년 투자 계획",
      "tags": ["영업현황", "수주현황", "CETI 매출", "CETI 비중"],
      "stakeChange": "-5.2%",
      "shareChange": "-5.2%",
      "bookmarked": false
    }
  ],
  "communications": [
    {
      "quarter": "1Q25",
      "type": "대면미팅",
      "details": []
    },
    {
      "quarter": "2Q25",
      "type": "비대면미팅",
      "details": []
    },
    {
      "quarter": "3Q25",
      "type": "One-on-One",
      "details": [
        {
          "name": "2Q25 - 지역별(6)",
          "values": ["단독만남", "IR 전략", "노쇼", "수익성"]
        }
      ]
    }
  ]
}
```

## Error Responses

### 404 Not Found
투자자를 찾을 수 없는 경우

```json
{
  "error": "Investor not found",
  "message": "해당 ID의 투자자를 찾을 수 없습니다."
}
```

### 401 Unauthorized
인증되지 않은 요청

```json
{
  "error": "Unauthorized",
  "message": "인증이 필요합니다."
}
```

## 참고사항

### 날짜 형식
- 차트 분기: "1Q22", "2Q22" 형식 (분기 + 연도 2자리)
- 면담 날짜: "25.09.25" 형식 (YY.MM.DD)
- 면담 시간: "14:00" 형식 (HH:MM)

### 국가 코드
- ISO 3166-1 alpha-2 코드 사용 (예: FR, US, JP, KR, CN, UK)
- 프론트엔드에서 국기 아이콘 표시에 사용

### 차트 데이터
- `value`: 실제 수치 값 (정수)
- `rate`: 백분율 (소수점 첫째자리까지, 예: 2.8)
- `highlightedQuarters`: 현재 분기를 강조 표시할 때 사용 (주황색 박스)

### 타입 정의
프론트엔드 타입 정의는 다음 파일에 있습니다:
- `app/features/investors/detail/model/types.ts`
- `app/features/investors/overview/model/types.ts`

### 구현 상태
✅ **백엔드 구현 완료** (2025-10-28)
- 모든 API 엔드포인트 구현 완료
- 데이터베이스 스키마 및 마이그레이션 완료
- Seed 데이터 제공
- `interests`: Word Cloud 데이터 제공 (프론트엔드 버블 차트 구현 대기)
- `activities`: 활동 타임라인 데이터 제공 (프론트엔드 구현 대기)
- `communications`: 커뮤니케이션 프로젝트 데이터 제공 (프론트엔드 시각화 구현 대기)

---

## 백엔드 구현 상세

### 데이터베이스 스키마

이 API는 다음 데이터베이스 테이블을 사용합니다:

#### 기존 테이블
- **`investors`**: 투자자 기본 정보 (id, name, country, city, parent/child 계층)
- **`investorSnapshots`**: 분기별 메트릭 (year, quarter, sOverO, ord, adr, ranking 등)
- **`countries`**: 국가 참조 테이블 (ISO 코드, 한글/영문명)

#### 신규 추가 테이블 (2025-10-28)
- **`investor_meetings`**: 면담 이력
  - `meeting_date`, `meeting_type`, `topic`, `participants`, `tags`, `change_rate`
- **`investor_interests`**: 관심사 주제 (Word Cloud용)
  - `topic`, `frequency` (빈도수 = 가중치)
- **`investor_activities`**: 활동 타임라인
  - `activity_date`, `activity_type`, `description`, `participants`, `tags`, `change_rate`
- **`investor_communications`**: 커뮤니케이션 프로젝트
  - `communication_date`, `communication_type`, `description`, `participants`, `tags`

### 주요 구현 파일

| 파일 | 설명 |
|------|------|
| `src/database/schemas/investor.schema.ts` | 데이터베이스 스키마 정의 |
| `src/database/migrations/0014_flat_mantis.sql` | 신규 테이블 마이그레이션 |
| `src/investor/investor.service.ts` | 비즈니스 로직 (getInvestorDetailForFrontend) |
| `src/investor/investor.controller.ts` | API 엔드포인트 |
| `src/investor/dto/investor-detail-response.dto.ts` | 응답 DTO 및 Zod 스키마 |
| `src/database/seeds/investor.seed.ts` | 샘플 데이터 |

### API 사용 방법

#### 1. 데이터베이스 마이그레이션
```bash
npm run db:migrate
```

#### 2. Seed 데이터 생성 (선택)
```bash
npm run db:seed
```

#### 3. 서버 실행
```bash
# 개발 모드 (Hot reload, Swagger 활성화)
npm run start:dev

# 프로덕션 모드
npm run start:prod
```

#### 4. API 호출 예시
```bash
# 자동으로 최신 분기 데이터 조회
GET http://localhost:3000/api/investors/1

# 헤더에 JWT 토큰 필요
Authorization: Bearer <your-jwt-token>
```

### 비즈니스 로직 상세

#### 메트릭 계산
- **전 분기 대비 변화율 자동 계산**: 현재 분기와 이전 분기 snapshot을 비교하여 백분율 계산
- **ORD + ADR 합산**: 보유주식수와 ADR 합산 자동 계산

#### 차트 데이터
- **전체 분기 조회**: 해당 투자자의 모든 분기 snapshot을 조회
- **분기 포맷**: `${quarter}Q${year_2자리}` (예: "4Q24")
- **현재/이전 분기 강조**: `highlightedQuarters` 배열에 자동 포함

#### Enum 매핑
- **투자자 타입**: INVESTMENT_ADVISOR → "투자자문사" 등 한글 변환
- **스타일 태그**: POSITIVE → "긍정적", QUESTION_HEAVY → "질문 많음" 등
- **회전율**: HIGH → "High", MEDIUM → "Medium", LOW → "Low"
- **운용방식**: ACTIVE → "Active", INACTIVE → "Inactive"

#### 날짜 포맷팅
- **면담/활동 날짜**: YY.MM.DD 형식 (예: "25.09.25")
- **면담/활동 시간**: HH:MM 형식 (예: "14:00")
- **분기 그룹핑**: 커뮤니케이션 데이터를 분기별로 자동 그룹화

### 테스트 데이터

Seed 스크립트 실행 시 다음 데이터가 생성됩니다:
- **투자자**: BlackRock Investment, Fidelity Asset Management, Northern Trust
- **국가**: 일본(JP), 홍콩(HK), 모리셔스(MU), 네덜란드(NL), 미국(US)
- **면담 이력**: 4개 (BlackRock 3개, Fidelity 1개)
- **관심사**: 10개 (주주환원, 탑직 리스크, 경영권, ESG 전략 등)
- **활동**: 3개
- **커뮤니케이션**: 4개

### 주의사항

1. **인증 필수**: JWT 인증이 필요한 엔드포인트입니다 (`@UseGuards(JwtAuthGuard)`)
2. **자동 최신 분기 조회**: Query Parameters 없이 자동으로 가장 최신 분기 데이터를 조회합니다
3. **snapshot 없는 경우**: 투자자에게 snapshot 데이터가 없으면 404 에러 반환
4. **이전 분기 없는 경우**: 변화율 계산 불가 시 "지난 분기 대비 N/A" 반환
5. **차트 데이터**: 모든 분기의 snapshot 데이터를 포함 (2022Q1 ~ 최신 분기)
