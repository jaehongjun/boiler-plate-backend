# API Documentation

## 개요

이 문서는 NestJS 백엔드 API의 모든 엔드포인트에 대한 상세한 정보를 제공합니다.

## 기본 정보

- **Base URL**: `http://localhost:3000`
- **인증 방식**: JWT Bearer Token
- **응답 형식**: JSON

---

## 1. 기본 API

### 1.1 헬스체크

- **엔드포인트**: `GET /`
- **설명**: 서버 상태를 확인합니다.
- **인증**: 불필요
- **요청 파라미터**: 없음
- **응답**:
  ```json
  {
    "message": "Hello World!"
  }
  ```

---

## 2. 인증 API

### 2.1 회원가입

- **엔드포인트**: `POST /auth/register`
- **설명**: 이메일, 비밀번호, 이름으로 회원가입합니다.
- **인증**: 불필요
- **요청 본문**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "홍길동"
  }
  ```
- **응답** (201):
  ```json
  {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "홍길동",
      "avatar": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer"
  }
  ```

### 2.2 로그인

- **엔드포인트**: `POST /auth/login`
- **설명**: 이메일과 비밀번호로 로그인합니다.
- **인증**: 불필요
- **요청 본문**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **응답** (200):
  ```json
  {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "홍길동",
      "avatar": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer"
  }
  ```

### 2.3 내 정보 조회

- **엔드포인트**: `GET /auth/me`
- **설명**: 현재 로그인한 사용자의 정보를 조회합니다.
- **인증**: JWT 토큰 필요
- **요청 파라미터**: 없음
- **응답** (200):
  ```json
  {
    "id": "user-id",
    "email": "user@example.com",
    "name": "홍길동",
    "avatar": "https://example.com/avatar.jpg",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```

### 2.4 프로필 수정

- **엔드포인트**: `PATCH /auth/profile`
- **설명**: 사용자의 프로필 정보를 수정합니다.
- **인증**: JWT 토큰 필요
- **요청 본문**:
  ```json
  {
    "name": "새로운 이름",
    "avatar": "https://example.com/new-avatar.jpg"
  }
  ```
- **응답** (200):
  ```json
  {
    "id": "user-id",
    "email": "user@example.com",
    "name": "새로운 이름",
    "avatar": "https://example.com/new-avatar.jpg",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```

### 2.5 로그아웃

- **엔드포인트**: `POST /auth/logout`
- **설명**: 사용자를 로그아웃시킵니다.
- **인증**: JWT 토큰 필요
- **요청 파라미터**: 없음
- **응답** (200):
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

### 2.6 토큰 재발급

- **엔드포인트**: `POST /auth/refresh`
- **설명**: 리프레시 토큰으로 액세스 토큰을 재발급합니다.
- **인증**: 불필요
- **요청 본문**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **응답** (200):
  ```json
  {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "홍길동",
      "avatar": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer"
  }
  ```

---

## 3. 즐겨찾기 API

### 3.1 즐겨찾기 목록 조회

- **엔드포인트**: `GET /favorites`
- **설명**: 사용자의 즐겨찾기 목록을 조회합니다.
- **인증**: JWT 토큰 필요
- **요청 파라미터**: 없음
- **응답** (200): 즐겨찾기 목록

### 3.2 즐겨찾기 추가

- **엔드포인트**: `POST /favorites/:symbol`
- **설명**: 특정 심볼을 즐겨찾기에 추가합니다.
- **인증**: JWT 토큰 필요
- **경로 파라미터**:
  - `symbol`: 주식 심볼 (1-10자, 자동으로 대문자 변환)
- **응답** (200):
  ```json
  {
    "message": "Added to favorites",
    "symbol": "AAPL"
  }
  ```

### 3.3 즐겨찾기 제거

- **엔드포인트**: `DELETE /favorites/:symbol`
- **설명**: 특정 심볼을 즐겨찾기에서 제거합니다.
- **인증**: JWT 토큰 필요
- **경로 파라미터**:
  - `symbol`: 주식 심볼 (1-10자, 자동으로 대문자 변환)
- **응답** (200):
  ```json
  {
    "message": "Removed from favorites",
    "symbol": "AAPL"
  }
  ```

### 3.4 즐겨찾기 확인

- **엔드포인트**: `GET /favorites/:symbol/check`
- **설명**: 특정 심볼이 즐겨찾기에 있는지 확인합니다.
- **인증**: JWT 토큰 필요
- **경로 파라미터**:
  - `symbol`: 주식 심볼 (1-10자, 자동으로 대문자 변환)
- **응답** (200):
  ```json
  {
    "symbol": "AAPL",
    "isFavorite": true
  }
  ```

---

## 4. 가격 알림 API

### 4.1 가격 알림 목록 조회

- **엔드포인트**: `GET /alerts`
- **설명**: 사용자의 가격 알림 목록을 조회합니다.
- **인증**: JWT 토큰 필요
- **요청 파라미터**: 없음
- **응답** (200): 가격 알림 목록

### 4.2 가격 알림 생성

- **엔드포인트**: `POST /alerts`
- **설명**: 새로운 가격 알림을 생성합니다.
- **인증**: JWT 토큰 필요
- **요청 본문**:
  ```json
  {
    "symbol": "AAPL",
    "targetPrice": "150.00",
    "condition": "above"
  }
  ```
- **응답** (200):
  ```json
  {
    "message": "Price alert created",
    "alert": {
      "id": "alert-id",
      "symbol": "AAPL",
      "targetPrice": "150.00",
      "condition": "above"
    }
  }
  ```

---

## 5. 포트폴리오 API

### 5.1 포트폴리오 데이터 조회

- **엔드포인트**: `GET /portfolio/:accountId`
- **설명**: 특정 계정의 포트폴리오 데이터를 조회합니다.
- **인증**: 불필요
- **경로 파라미터**:
  - `accountId`: 계정 ID
- **응답** (200):
  ```json
  {
    "data": {
      "account": {
        "id": "account-id",
        "name": "계정명",
        "type": "INDIVIDUAL",
        "balance": 1000000,
        "cash": 500000,
        "investedAmount": 500000,
        "totalValue": 1000000,
        "totalPnL": 0,
        "totalPnLPercent": 0,
        "lastUpdated": "2024-01-01T00:00:00.000Z"
      },
      "assets": [],
      "performance": [],
      "allocation": [],
      "recentTransactions": [],
      "summary": {
        "totalAssets": 1000000,
        "totalLiabilities": 0,
        "netWorth": 1000000,
        "totalReturn": 0,
        "totalReturnPercent": 0,
        "annualizedReturn": 0,
        "riskMetrics": {
          "volatility": 0,
          "sharpeRatio": 0,
          "maxDrawdown": 0,
          "beta": 0
        }
      },
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    },
    "message": "포트폴리오 데이터를 성공적으로 조회했습니다."
  }
  ```

### 5.2 포트폴리오 성과 조회

- **엔드포인트**: `GET /portfolio/:accountId/performance`
- **설명**: 특정 계정의 포트폴리오 성과 데이터를 조회합니다.
- **인증**: 불필요
- **경로 파라미터**:
  - `accountId`: 계정 ID
- **쿼리 파라미터**:
  - `period`: 기간 (1D, 1W, 1M, 3M, 6M, 1Y, ALL)
- **응답** (200):
  ```json
  {
    "data": [
      {
        "period": "1M",
        "return": 50000,
        "returnPercent": 5.0,
        "benchmarkReturn": 30000,
        "benchmarkReturnPercent": 3.0,
        "excessReturn": 20000,
        "volatility": 0.15,
        "sharpeRatio": 1.2,
        "maxDrawdown": -0.05
      }
    ],
    "message": "포트폴리오 성과 데이터를 성공적으로 조회했습니다."
  }
  ```

### 5.3 포트폴리오 자산 조회

- **엔드포인트**: `GET /portfolio/:accountId/assets`
- **설명**: 특정 계정의 포트폴리오 자산 데이터를 조회합니다.
- **인증**: 불필요
- **경로 파라미터**:
  - `accountId`: 계정 ID
- **응답** (200):
  ```json
  {
    "data": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "quantity": 100,
        "averagePrice": 150.0,
        "currentPrice": 155.0,
        "marketValue": 15500,
        "unrealizedPnL": 500,
        "unrealizedPnLPercent": 3.33,
        "weight": 0.6,
        "sector": "Technology"
      }
    ],
    "message": "포트폴리오 자산 데이터를 성공적으로 조회했습니다."
  }
  ```

### 5.4 포트폴리오 할당 조회

- **엔드포인트**: `GET /portfolio/:accountId/allocation`
- **설명**: 특정 계정의 포트폴리오 자산 할당 데이터를 조회합니다.
- **인증**: 불필요
- **경로 파라미터**:
  - `accountId`: 계정 ID
- **응답** (200):
  ```json
  {
    "data": [
      {
        "assetClass": "Stocks",
        "amount": 800000,
        "percentage": 80.0,
        "change": 50000,
        "changePercent": 6.67
      }
    ],
    "message": "포트폴리오 할당 데이터를 성공적으로 조회했습니다."
  }
  ```

### 5.5 포트폴리오 거래 내역 조회

- **엔드포인트**: `GET /portfolio/:accountId/transactions`
- **설명**: 특정 계정의 포트폴리오 거래 내역을 조회합니다.
- **인증**: 불필요
- **경로 파라미터**:
  - `accountId`: 계정 ID
- **쿼리 파라미터**:
  - `limit`: 조회할 거래 건수 (선택사항)
- **응답** (200):
  ```json
  {
    "data": {
      "data": [
        {
          "id": "transaction-id",
          "symbol": "AAPL",
          "type": "BUY",
          "quantity": 100,
          "price": 150.0,
          "amount": 15000,
          "date": "2024-01-01T00:00:00.000Z",
          "fees": 10
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
      }
    },
    "message": "포트폴리오 거래 내역을 성공적으로 조회했습니다."
  }
  ```

---

## 6. 에러 응답

### 공통 에러 응답 형식

```json
{
  "error": "Error Type",
  "message": "에러 메시지",
  "statusCode": 400
}
```

### 주요 HTTP 상태 코드

- **200**: 성공
- **201**: 생성 성공
- **400**: 잘못된 요청
- **401**: 인증되지 않은 요청
- **409**: 충돌 (예: 이미 존재하는 이메일)
- **500**: 서버 내부 오류

---

## 7. 인증 헤더

JWT 토큰이 필요한 API의 경우 다음 헤더를 포함해야 합니다:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 8. 데이터 검증 규칙

### 이메일

- 유효한 이메일 형식이어야 함

### 비밀번호

- 최소 6자 이상

### 이름

- 1-100자 사이

### 주식 심볼

- 1-10자 사이
- 자동으로 대문자 변환

### 가격

- 숫자 형식 (소수점 최대 2자리)

### 조건

- `above` 또는 `below` 중 하나
