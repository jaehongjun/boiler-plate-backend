# 📊 투자증권 CRM 시스템 API 문서

## 개요

투자증권 CRM 시스템은 고객 관리, 상담 이력, 투자계좌, 투자상품, 거래내역을 통합적으로 관리하는 시스템입니다.

## 기본 정보

- **Base URL**: `http://localhost:8080/api`
- **인증**: JWT 토큰 필요 (Authorization 헤더에 Bearer 토큰 포함)
- **응답 형식**: JSON

## 공통 응답 형식

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

## 1. 고객 관리 API

### 1.1 고객 생성

**POST** `/crm/customers`

**Request Body:**

```json
{
  "customerName": "홍길동",
  "residentNo": "123456-1234567",
  "phoneNo": "010-1234-5678",
  "email": "hong@example.com",
  "address": "서울시 강남구",
  "customerGrade": "VIP",
  "joinDate": "2024-01-01"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "customerId": 1,
    "customerName": "홍길동",
    "residentNo": "123456-1234567",
    "phoneNo": "010-1234-5678",
    "email": "hong@example.com",
    "address": "서울시 강남구",
    "customerGrade": "VIP",
    "joinDate": "2024-01-01",
    "status": "ACTIVE",
    "regDate": "2024-01-01T00:00:00.000Z"
  },
  "message": "고객이 성공적으로 생성되었습니다."
}
```

### 1.2 고객 목록 조회

**GET** `/customers`

**Query Parameters:**

- `customerName` (optional): 고객명 검색
- `customerGrade` (optional): 고객 등급 (VIP, GENERAL, POTENTIAL)
- `status` (optional): 상태 (ACTIVE, INACTIVE)
- `joinDateFrom` (optional): 가입일 시작
- `joinDateTo` (optional): 가입일 종료
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 개수 (기본값: 10)

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "customerId": 1,
        "customerName": "홍길동",
        "customerGrade": "VIP",
        "status": "ACTIVE",
        "joinDate": "2024-01-01",
        "regDate": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 1.3 고객 상세 조회

**GET** `/customers/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "customerId": 1,
    "customerName": "홍길동",
    "residentNo": "123456-1234567",
    "phoneNo": "010-1234-5678",
    "email": "hong@example.com",
    "address": "서울시 강남구",
    "customerGrade": "VIP",
    "joinDate": "2024-01-01",
    "lastContactDate": "2024-01-15T00:00:00.000Z",
    "status": "ACTIVE",
    "regDate": "2024-01-01T00:00:00.000Z"
  }
}
```

### 1.4 고객 정보 수정

**PUT** `/customers/:id`

**Request Body:**

```json
{
  "customerName": "홍길순",
  "phoneNo": "010-9876-5432"
}
```

### 1.5 고객 삭제

**DELETE** `/customers/:id`

## 2. 상담/문의 이력 API

### 2.1 상담 이력 생성

**POST** `/customers/:customerId/contacts`

**Request Body:**

```json
{
  "contactType": "PHONE",
  "contactPurpose": "INVESTMENT_INQUIRY",
  "contactNote": "펀드 상품 문의",
  "managerId": 1
}
```

### 2.2 고객별 상담 이력 조회

**GET** `/customers/:customerId/contacts`

## 3. 투자계좌 API

### 3.1 계좌 생성

**POST** `/customers/:customerId/accounts`

**Request Body:**

```json
{
  "accountNo": "123-456789-01",
  "accountType": "TRUST",
  "openDate": "2024-01-01",
  "balance": 1000000
}
```

### 3.2 고객별 계좌 목록 조회

**GET** `/customers/:customerId/accounts`

### 3.3 계좌 정보 수정

**PUT** `/accounts/:id`

**Request Body:**

```json
{
  "balance": 1500000,
  "status": "ACTIVE"
}
```

## 4. 투자상품 API

### 4.1 상품 생성

**POST** `/products`

**Request Body:**

```json
{
  "productName": "삼성전자 주식",
  "productType": "STOCK",
  "riskLevel": "MEDIUM",
  "issuer": "삼성전자"
}
```

### 4.2 상품 목록 조회

**GET** `/products`

### 4.3 상품 상세 조회

**GET** `/products/:id`

### 4.4 상품 정보 수정

**PUT** `/products/:id`

## 5. 거래내역 API

### 5.1 거래 생성

**POST** `/transactions`

**Request Body:**

```json
{
  "accountId": 1,
  "productId": 1,
  "tradeType": "BUY",
  "tradeAmount": 100,
  "tradePrice": 50000
}
```

### 5.2 거래내역 조회

**GET** `/transactions`

**Query Parameters:**

- `accountId` (optional): 계좌 ID
- `productId` (optional): 상품 ID
- `tradeType` (optional): 거래 유형 (BUY, SELL)
- `tradeDateFrom` (optional): 거래일 시작
- `tradeDateTo` (optional): 거래일 종료
- `page` (optional): 페이지 번호
- `limit` (optional): 페이지당 개수

## 6. 통계 API

### 6.1 고객 통계

**GET** `/statistics/customers`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalCustomers": 100,
    "activeCustomers": 85,
    "vipCustomers": 15,
    "newCustomersThisMonth": 10
  }
}
```

### 6.2 거래 통계

**GET** `/statistics/transactions`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalTransactions": 500,
    "totalVolume": 50000000,
    "buyTransactions": 300,
    "sellTransactions": 200
  }
}
```

## 에러 응답

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

## 상태 코드

- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 내부 오류

## 데이터 타입

### 고객 등급 (customerGrade)

- `VIP`: VIP 고객
- `GENERAL`: 일반 고객
- `POTENTIAL`: 잠재 고객

### 고객 상태 (status)

- `ACTIVE`: 활성
- `INACTIVE`: 비활성

### 연락 유형 (contactType)

- `PHONE`: 전화
- `VISIT`: 방문
- `ONLINE`: 온라인
- `EMAIL`: 이메일

### 연락 목적 (contactPurpose)

- `INQUIRY`: 문의
- `COMPLAINT`: 불만
- `CONSULTATION`: 상담
- `INVESTMENT_INQUIRY`: 투자문의

### 계좌 유형 (accountType)

- `TRUST`: 위탁계좌
- `PENSION`: 연금계좌
- `CMA`: CMA

### 상품 유형 (productType)

- `STOCK`: 주식
- `BOND`: 채권
- `FUND`: 펀드
- `ELS`: ELS
- `ETF`: ETF

### 위험도 (riskLevel)

- `HIGH`: 고위험
- `MEDIUM`: 중위험
- `LOW`: 저위험

### 거래 유형 (tradeType)

- `BUY`: 매수
- `SELL`: 매도
