# Business Trip API 문서

출장 관리 시스템 API 문서입니다. 도시별 호텔/레스토랑 정보와 방문 기록, 리뷰를 관리할 수 있습니다.

## 목차
- [인증](#인증)
- [API 엔드포인트](#api-엔드포인트)
  - [도시 관리](#도시-관리)
  - [장소 관리](#장소-관리)
  - [방문 기록](#방문-기록)
  - [리뷰 관리](#리뷰-관리)
- [데이터 모델](#데이터-모델)
- [Enum 값](#enum-값)

---

## 인증

모든 API 요청은 JWT 토큰 인증이 필요합니다.

```
Authorization: Bearer {access_token}
```

---

## API 엔드포인트

### 지도 통계 (핵심 API)

#### 1. 지도 표시용 도시별 통계 조회

```
GET /api/business-trips/map-statistics
```

**지도 메인 화면에서 사용하는 핵심 API입니다.**
모든 도시의 좌표와 통계 정보를 조회하여 지도에 표시합니다.

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "베를린",
    "nameEn": "Berlin",
    "countryCode": "DE",
    "latitude": "52.5200066",
    "longitude": "13.4049540",
    "statistics": {
      "totalVisits": 64,
      "hotelCount": 5,
      "restaurantCount": 3,
      "lastVisitDate": "2025-08-26"
    }
  },
  {
    "id": 2,
    "name": "도쿄",
    "nameEn": "Tokyo",
    "countryCode": "JP",
    "latitude": "35.6762",
    "longitude": "139.6503",
    "statistics": {
      "totalVisits": 52,
      "hotelCount": 4,
      "restaurantCount": 6,
      "lastVisitDate": "2025-09-15"
    }
  }
]
```

**프론트엔드 렌더링 가이드:**
- `latitude`, `longitude`: 지도 상의 마커 위치
- `statistics.totalVisits`: 원형 버블의 크기와 내부 숫자로 표시
- `statistics.hotelCount`, `restaurantCount`: 도시 클릭 시 상세 정보에 표시
- `statistics.lastVisitDate`: 최근 활동 표시

**주요 도시 좌표 참고:**
```typescript
const cityCoordinates = {
  서울: { lat: 37.5665, lng: 126.9780 },
  도쿄: { lat: 35.6762, lng: 139.6503 },
  베를린: { lat: 52.5200, lng: 13.4050 },
  뉴욕: { lat: 40.7128, lng: -74.0060 },
  런던: { lat: 51.5074, lng: -0.1278 },
  파리: { lat: 48.8566, lng: 2.3522 },
  싱가포르: { lat: 1.3521, lng: 103.8198 },
  홍콩: { lat: 22.3193, lng: 114.1694 },
  두바이: { lat: 25.2048, lng: 55.2708 },
  시드니: { lat: -33.8688, lng: 151.2093 },
};
```

---

### 도시 관리

#### 2. 도시 목록 조회

```
GET /api/business-trips/cities
```

모든 도시 목록을 국가 정보 및 좌표와 함께 조회합니다.

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "베를린",
    "nameEn": "Berlin",
    "countryCode": "DE",
    "countryName": "독일",
    "countryNameEn": "Germany",
    "timezone": "Europe/Berlin",
    "latitude": "52.5200066",
    "longitude": "13.4049540"
  }
]
```

---

#### 3. 도시 생성

```
POST /api/business-trips/cities
```

새로운 도시를 생성합니다. 지도에 표시하려면 좌표 정보를 함께 입력해야 합니다.

**Request Body:**
```json
{
  "name": "베를린",
  "nameEn": "Berlin",
  "countryCode": "DE",
  "timezone": "Europe/Berlin",
  "latitude": "52.5200066",
  "longitude": "13.4049540"
}
```

**Response 201:**
```json
{
  "id": 1,
  "name": "베를린",
  "nameEn": "Berlin",
  "countryCode": "DE",
  "timezone": "Europe/Berlin",
  "latitude": "52.5200066",
  "longitude": "13.4049540",
  "createdAt": "2025-10-30T10:00:00.000Z"
}
```

---

### 장소 관리

#### 4. 도시별 주변 정보 조회 (모달용 API)

```
GET /api/business-trips/cities/:cityId/places?type={HOTEL|RESTAURANT}
```

특정 도시의 호텔/레스토랑 목록을 방문 기록과 함께 조회합니다.
**이 API가 모달에 표시될 주변 정보를 제공합니다.**

**Path Parameters:**
- `cityId` (number, required): 도시 ID

**Query Parameters:**
- `type` (string, optional): 장소 타입 필터 (`HOTEL` 또는 `RESTAURANT`)

**Response 200:**
```json
{
  "places": [
    {
      "id": 1,
      "name": "Hilton Berlin",
      "type": "HOTEL",
      "address": "Stauffenbergstraße 26, 10785 Berlin, Germany",
      "averageRating": "4.00",
      "visitCount": 4,
      "lastVisitDate": "2025-08-26",
      "phone": "+49 30 123456",
      "website": "https://hilton.com",
      "notes": null,
      "cityId": 1,
      "cityName": "베를린",
      "visits": [
        {
          "id": 1,
          "startDate": "2025-08-24",
          "endDate": "2025-08-26",
          "nights": 2,
          "companions": ["C_LEVEL", "DIRECTOR"],
          "notes": "공항 픽업 필요",
          "createdAt": "2025-10-30T10:00:00.000Z"
        }
      ]
    }
  ]
}
```

**프론트엔드 렌더링 가이드:**
- `places` 배열의 각 항목을 카드로 표시
- `type`이 `HOTEL`이면 호텔 탭, `RESTAURANT`이면 레스토랑 탭에 표시
- `averageRating`: 별점 (소수점 2자리)
- `visitCount`: "방문 N회" 텍스트에 사용
- `lastVisitDate`: "최근 방문 YYYY.MM.DD." 형식으로 변환
- `visits` 배열: 각 방문 기록 표시
  - `startDate`와 `endDate`: "YYYY.MM.DD-YYYY.MM.DD" 형식
  - `nights`: "N박" 배지
  - `companions`: 동행자 타입 배열을 배지로 표시

---

#### 5. 장소 추가

```
POST /api/business-trips/places
```

새로운 호텔/레스토랑 정보를 추가합니다.

**Request Body:**
```json
{
  "name": "Hilton Berlin",
  "type": "HOTEL",
  "cityId": 1,
  "address": "Stauffenbergstraße 26, 10785 Berlin, Germany",
  "phone": "+49 30 123456",
  "website": "https://hilton.com",
  "notes": "공항 근처"
}
```

**Response 201:**
```json
{
  "id": 1,
  "name": "Hilton Berlin",
  "type": "HOTEL",
  "cityId": 1,
  "address": "Stauffenbergstraße 26, 10785 Berlin, Germany",
  "averageRating": null,
  "visitCount": 0,
  "lastVisitDate": null,
  "phone": "+49 30 123456",
  "website": "https://hilton.com",
  "notes": "공항 근처",
  "createdAt": "2025-10-30T10:00:00.000Z",
  "updatedAt": "2025-10-30T10:00:00.000Z"
}
```

---

#### 6. 장소 상세 조회

```
GET /api/business-trips/places/:placeId
```

특정 장소의 상세 정보를 모든 방문 기록 및 리뷰와 함께 조회합니다.

**Path Parameters:**
- `placeId` (number, required): 장소 ID

**Response 200:**
```json
{
  "id": 1,
  "name": "Hilton Berlin",
  "type": "HOTEL",
  "address": "Stauffenbergstraße 26, 10785 Berlin, Germany",
  "averageRating": "4.50",
  "visitCount": 4,
  "lastVisitDate": "2025-08-26",
  "phone": "+49 30 123456",
  "website": "https://hilton.com",
  "notes": "공항 근처",
  "cityId": 1,
  "cityName": "베를린",
  "visits": [
    {
      "id": 1,
      "startDate": "2025-08-24",
      "endDate": "2025-08-26",
      "nights": 2,
      "companions": ["C_LEVEL", "DIRECTOR"],
      "notes": "공항 픽업 필요",
      "createdAt": "2025-10-30T10:00:00.000Z",
      "reviews": [
        {
          "id": 1,
          "rating": 5,
          "content": "서비스가 매우 좋았습니다.",
          "createdAt": "2025-10-30T10:00:00.000Z"
        }
      ]
    }
  ]
}
```

**Response 404:**
```json
{
  "statusCode": 404,
  "message": "Place with id 999 not found"
}
```

---

### 방문 기록

#### 7. 방문 기록 추가

```
POST /api/business-trips/visits
```

장소에 대한 새로운 방문 기록을 추가합니다.
방문 기록이 추가되면 해당 장소의 통계(방문 횟수, 최근 방문일)가 자동으로 업데이트됩니다.

**Request Body:**
```json
{
  "placeId": 1,
  "startDate": "2025-08-24",
  "endDate": "2025-08-26",
  "nights": 2,
  "companions": ["C_LEVEL", "DIRECTOR"],
  "notes": "공항 픽업 필요"
}
```

**Field 설명:**
- `placeId` (number, required): 장소 ID
- `startDate` (string, required): 방문 시작일 (YYYY-MM-DD 형식)
- `endDate` (string, required): 방문 종료일 (YYYY-MM-DD 형식)
- `nights` (number, optional): 숙박 일수 (N박)
- `companions` (array, optional): 동행자 타입 배열 (Enum 참조)
- `notes` (string, optional): 비고

**Response 201:**
```json
{
  "id": 1,
  "placeId": 1,
  "userId": "f549c9b8-ce65-4cf2-89cd-76c95c43b244",
  "startDate": "2025-08-24",
  "endDate": "2025-08-26",
  "nights": 2,
  "companions": ["C_LEVEL", "DIRECTOR"],
  "notes": "공항 픽업 필요",
  "createdAt": "2025-10-30T10:00:00.000Z",
  "updatedAt": "2025-10-30T10:00:00.000Z"
}
```

---

### 리뷰 관리

#### 8. 리뷰 추가

```
POST /api/business-trips/reviews
```

방문 기록에 대한 리뷰를 추가합니다.
리뷰가 추가되면 해당 장소의 평균 평점이 자동으로 업데이트됩니다.

**Request Body:**
```json
{
  "placeId": 1,
  "visitId": 1,
  "rating": 5,
  "content": "서비스가 매우 좋았습니다."
}
```

**Field 설명:**
- `placeId` (number, required): 장소 ID
- `visitId` (number, required): 방문 기록 ID
- `rating` (number, required): 평점 (1-5)
- `content` (string, optional): 리뷰 내용

**Response 201:**
```json
{
  "id": 1,
  "placeId": 1,
  "visitId": 1,
  "userId": "f549c9b8-ce65-4cf2-89cd-76c95c43b244",
  "rating": 5,
  "content": "서비스가 매우 좋았습니다.",
  "createdAt": "2025-10-30T10:00:00.000Z",
  "updatedAt": "2025-10-30T10:00:00.000Z"
}
```

---

## 데이터 모델

### City (도시)
```typescript
{
  id: number;
  name: string;           // 한글 이름
  nameEn: string;         // 영문 이름
  countryCode: string;    // 국가 코드 (2자리)
  timezone?: string;      // 타임존
  latitude?: string;      // 위도 (decimal)
  longitude?: string;     // 경도 (decimal)
  createdAt: Date;
}
```

### Place (장소)
```typescript
{
  id: number;
  name: string;           // 장소명
  type: 'HOTEL' | 'RESTAURANT';
  cityId: number;
  address: string;        // 주소
  averageRating?: string; // 평균 평점 (decimal)
  visitCount: number;     // 방문 횟수
  lastVisitDate?: string; // 최근 방문일 (YYYY-MM-DD)
  phone?: string;
  website?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### PlaceVisit (방문 기록)
```typescript
{
  id: number;
  placeId: number;
  userId: string;         // UUID
  startDate: string;      // YYYY-MM-DD
  endDate: string;        // YYYY-MM-DD
  nights?: number;        // N박
  companions?: CompanionType[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### PlaceReview (리뷰)
```typescript
{
  id: number;
  placeId: number;
  visitId: number;
  userId: string;         // UUID
  rating: number;         // 1-5
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Enum 값

### PlaceType (장소 타입)
```typescript
enum PlaceType {
  HOTEL = 'HOTEL',           // 호텔
  RESTAURANT = 'RESTAURANT'  // 레스토랑
}
```

### CompanionType (동행자 타입)
```typescript
enum CompanionType {
  C_LEVEL = 'C_LEVEL',           // C-level (경영진)
  DIRECTOR = 'DIRECTOR',         // 부장
  MANAGER = 'MANAGER',           // 매니저
  TEAM_MEMBER = 'TEAM_MEMBER',   // 팀원
  PARTNER = 'PARTNER',           // 파트너
  OTHER = 'OTHER'                // 기타
}
```

**프론트엔드 표시 매핑:**
```typescript
const companionLabels = {
  C_LEVEL: 'C-level',
  DIRECTOR: '부장',
  MANAGER: '매니저',
  TEAM_MEMBER: '팀원',
  PARTNER: '파트너',
  OTHER: '기타'
};
```

---

## 워크플로우 예시

### 1. 지도 메인 화면 로드

```typescript
// 1. 지도 통계 데이터 가져오기
GET /api/business-trips/map-statistics

// 2. 각 도시의 좌표에 마커 표시
// 3. totalVisits 값에 따라 버블 크기 조정
// 4. 버블 내부에 totalVisits 숫자 표시
```

### 2. 도시 선택 모달 표시

```typescript
// 1. 지도에서 도시 클릭 (예: Berlin, cityId=1)

// 2. 선택한 도시의 호텔 정보 가져오기
GET /api/business-trips/cities/1/places?type=HOTEL

// 3. 탭 전환 시 레스토랑 정보 가져오기
GET /api/business-trips/cities/1/places?type=RESTAURANT
```

### 3. 새 호텔 추가

```typescript
// 1. "호텔정보 추가" 버튼 클릭
// 2. 폼 입력 후 제출
POST /api/business-trips/places
{
  "name": "New Hotel",
  "type": "HOTEL",
  "cityId": 1,
  "address": "..."
}

// 3. 성공 후 목록 다시 불러오기
GET /api/business-trips/cities/1/places?type=HOTEL
```

### 4. 방문 기록 및 리뷰 추가

```typescript
// 1. 방문 기록 추가
POST /api/business-trips/visits
{
  "placeId": 1,
  "startDate": "2025-08-24",
  "endDate": "2025-08-26",
  "nights": 2,
  "companions": ["C_LEVEL", "DIRECTOR"],
  "notes": "공항 픽업 필요"
}

// 2. 리뷰 추가
POST /api/business-trips/reviews
{
  "placeId": 1,
  "visitId": 1,  // 위에서 생성된 방문 기록 ID
  "rating": 5,
  "content": "서비스가 매우 좋았습니다."
}

// 3. 업데이트된 장소 정보 확인
GET /api/business-trips/places/1
```

---

## 에러 처리

### 공통 에러 응답

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Place with id 999 not found"
}
```

**400 Bad Request (Validation Error):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "rating",
      "message": "rating must be between 1 and 5"
    }
  ]
}
```

---

## Swagger 문서

서버 실행 후 Swagger UI에서 대화형 API 문서를 확인할 수 있습니다:

```
http://localhost:3000/docs
```

개발 환경에서만 활성화됩니다.

---

## 추가 정보

- **Base URL**: `http://localhost:3000/api` (개발), `https://your-domain.com/api` (프로덕션)
- **Content-Type**: `application/json`
- **인증 방식**: Bearer Token (JWT)
- **페이지네이션**: 현재 버전에서는 제공하지 않음 (향후 추가 예정)
- **정렬**: 최근 방문일 내림차순 → 방문 횟수 내림차순

---

## 변경 이력

### v1.0.0 (2025-10-30)
- 초기 버전 릴리스
- 도시, 장소, 방문 기록, 리뷰 CRUD API 구현
- JWT 인증 적용
