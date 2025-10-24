# IR API Usage Examples

This document provides example API requests and responses for the IR (Investor Relations) API.

## Authentication

All IR endpoints require JWT authentication. Include the access token in the Authorization header:

```bash
Authorization: Bearer <your-access-token>
```

To get a token, first login:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "...", "email": "...", "name": "..." }
  }
}
```

## 1. Create IR Activity

**POST** `/api/ir/activities`

```bash
curl -X POST http://localhost:8080/api/ir/activities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "정기 IR 미팅",
    "startDatetime": "2025-10-22T01:00:00Z",
    "endDatetime": "2025-10-24T09:00:00Z",
    "category": "외부",
    "status": "예정",
    "allDay": false,
    "location": "서울 본사 회의실",
    "description": "분기 실적 발표 및 투자자 미팅",
    "typePrimary": "NDR",
    "typeSecondary": "정기미팅",
    "memo": "주요 논의사항: Q3 실적, 향후 전략",
    "kbParticipants": [
      {
        "userId": "USER_UUID_1",
        "role": "주관"
      },
      {
        "userId": "USER_UUID_2",
        "role": "참석"
      }
    ],
    "visitors": [
      {
        "visitorName": "ABC투자사",
        "visitorType": "investor",
        "company": "ABC Capital"
      },
      {
        "visitorName": "Morgan Capital",
        "visitorType": "broker",
        "company": "Morgan Securities"
      }
    ],
    "keywords": ["정기미팅", "실적발표", "투자전략"],
    "subActivities": [
      {
        "title": "Morgan Capital 미팅",
        "status": "예정",
        "startDatetime": "2025-10-22T02:00:00Z",
        "endDatetime": "2025-10-22T03:00:00Z",
        "allDay": false,
        "category": "외부",
        "location": "여의도 회의실 A",
        "description": "Morgan 측과 NDR 논의",
        "typePrimary": "NDR",
        "typeSecondary": "1:1 미팅",
        "ownerId": "USER_UUID_2",
        "kbParticipants": [
          { "userId": "USER_UUID_2", "role": "주관" }
        ],
        "visitors": [
          { "visitorName": "Morgan Capital", "visitorType": "broker" }
        ],
        "keywords": ["Morgan", "NDR"]
      },
      {
        "title": "투자 계약서 검토",
        "status": "예정",
        "category": "내부",
        "typePrimary": "Internal",
        "ownerId": "USER_UUID_1"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "act-1729584000000-abc123",
    "title": "정기 IR 미팅",
    "startISO": "2025-10-22T01:00:00.000Z",
    "endISO": "2025-10-24T09:00:00.000Z",
    "status": "예정",
    "category": "외부",
    "location": "서울 본사 회의실",
    "typePrimary": "NDR",
    "typeSecondary": "정기미팅",
    "kbs": ["김민수", "박지영"],
    "visitors": ["ABC투자사", "Morgan Capital"],
    "keywords": ["정기미팅", "실적발표", "투자전략"],
    "subActivities": [
      {
        "id": "sub-1729584001000-xyz789",
        "title": "Morgan Capital 미팅",
        "status": "예정"
      },
      {
        "id": "sub-1729584002000-def456",
        "title": "투자 계약서 검토",
        "status": "예정"
      }
    ],
    "logs": [
      {
        "id": "log-1729584000000-ghi012",
        "type": "create",
        "user": "김민수",
        "message": "활동 생성: 정기 IR 미팅",
        "createdAtISO": "2025-10-22T01:00:00.000Z"
      }
    ],
    "createdAtISO": "2025-10-22T01:00:00.000Z",
    "updatedAtISO": "2025-10-22T01:00:00.000Z"
  },
  "message": "Activity created successfully"
}
```

## 2. Get Calendar Events

**GET** `/api/ir/calendar/events?start=2025-10-01T00:00:00Z&end=2025-10-31T23:59:59Z`

```bash
curl -X GET "http://localhost:8080/api/ir/calendar/events?start=2025-10-01T00:00:00Z&end=2025-10-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Optional Query Parameters:**
- `status`: Filter by status ('예정', '진행중', '완료', '중단', '전체')
- `category`: Filter by category ('내부', '외부', '휴가', '공휴일')

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "act-1729584000000-abc123",
        "title": "정기 IR 미팅",
        "start": "2025-10-22T01:00:00.000Z",
        "end": "2025-10-24T09:00:00.000Z",
        "allDay": false,
        "category": "외부",
        "location": "서울 본사 회의실",
        "description": "분기 실적 발표 및 투자자 미팅"
      },
      {
        "id": "act-1729670400000-def456",
        "title": "투자 브리핑",
        "start": "2025-10-23T02:00:00.000Z",
        "end": "2025-10-23T05:00:00.000Z",
        "allDay": false,
        "category": "외부",
        "location": "여의도 금융센터"
      }
    ]
  },
  "message": "Calendar events retrieved successfully"
}
```

## 3. Get Timeline Activities

**GET** `/api/ir/timeline/activities?start=2025-10-01T00:00:00Z&end=2025-10-31T23:59:59Z&status=진행중`

```bash
curl -X GET "http://localhost:8080/api/ir/timeline/activities?start=2025-10-01T00:00:00Z&end=2025-10-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "act-1729584000000-abc123",
        "title": "정기 IR 미팅",
        "startISO": "2025-10-22T01:00:00.000Z",
        "endISO": "2025-10-24T09:00:00.000Z",
        "status": "진행중",
        "subActivities": [
          {
            "id": "sub-1729584001000-xyz789",
            "title": "Morgan Capital 미팅",
            "owner": "장도윤",
            "status": "완료"
          },
          {
            "id": "sub-1729584002000-def456",
            "title": "투자 계약서 검토",
            "owner": "김민수",
            "status": "진행중"
          }
        ]
      }
    ]
  },
  "message": "Timeline activities retrieved successfully"
}
```

## 4. Get Activity Details

**GET** `/api/ir/activities/:id`

```bash
curl -X GET http://localhost:8080/api/ir/activities/act-1729584000000-abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "act-1729584000000-abc123",
    "title": "정기 IR 미팅",
    "startISO": "2025-10-22T01:00:00.000Z",
    "endISO": "2025-10-24T09:00:00.000Z",
    "status": "진행중",
    "allDay": false,
    "category": "외부",
    "location": "서울 본사 회의실",
    "description": "분기 실적 발표 및 투자자 미팅",
    "typePrimary": "NDR",
    "typeSecondary": "정기미팅",
    "kbs": ["김민수", "박지영"],
    "visitors": ["ABC투자사", "Morgan Capital"],
    "memo": "주요 논의사항: Q3 실적, 향후 전략",
    "keywords": ["정기미팅", "실적발표", "투자전략"],
    "subActivities": [
      {
        "id": "sub-1729584001000-xyz789",
        "title": "Morgan Capital 미팅",
        "owner": "장도윤",
        "status": "완료"
      }
    ],
    "attachments": [],
    "owner": "김민수",
    "investors": ["ABC투자사"],
    "brokers": ["Morgan Capital"],
    "logs": [
      {
        "id": "log-1729584000000-ghi012",
        "type": "create",
        "user": "김민수",
        "message": "활동 생성: 정기 IR 미팅",
        "createdAtISO": "2025-10-22T01:00:00.000Z"
      },
      {
        "id": "log-1729584003000-jkl345",
        "type": "status",
        "user": "김민수",
        "message": "상태 변경: 예정 → 진행중",
        "oldValue": "예정",
        "newValue": "진행중",
        "createdAtISO": "2025-10-22T02:00:00.000Z"
      }
    ],
    "createdAtISO": "2025-10-22T01:00:00.000Z",
    "updatedAtISO": "2025-10-22T02:00:00.000Z"
  },
  "message": "Activity retrieved successfully"
}
```

## 5. Update Activity

**PATCH** `/api/ir/activities/:id`

Partial update - only include fields you want to change:

```bash
curl -X PATCH http://localhost:8080/api/ir/activities/act-1729584000000-abc123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "정기 IR 미팅 (수정)",
    "location": "강남 본사 회의실",
    "memo": "주요 논의사항: Q3 실적, 향후 전략, 신규 투자 계획"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Full activity entity with updated fields
    "title": "정기 IR 미팅 (수정)",
    "location": "강남 본사 회의실",
    "logs": [
      {
        "type": "update",
        "message": "활동 수정",
        "createdAtISO": "2025-10-22T03:00:00.000Z"
      }
      // ... previous logs
    ]
  },
  "message": "Activity updated successfully"
}
```

You can also update dates. The API accepts either `startDatetime`/`endDatetime` or `startISO`/`endISO` (ISO8601):

```bash
curl -X PATCH http://localhost:8080/api/ir/activities/act-1729584000000-abc123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startISO": "2025-10-14T15:30:00.000Z",
    "endISO": "2025-11-06T15:30:00.000Z"
  }'
```

Note: To clear `endDatetime`, send `endDatetime` explicitly as `null` is not supported yet; prefer providing a concrete date or omit the field to keep it unchanged.

## 6. Update Activity Status

**PATCH** `/api/ir/activities/:id/status`

```bash
curl -X PATCH http://localhost:8080/api/ir/activities/act-1729584000000-abc123/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "완료"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "완료",
    "resolvedAtISO": "2025-10-22T04:00:00.000Z",
    "logs": [
      {
        "type": "status",
        "message": "상태 변경: 진행중 → 완료",
        "oldValue": "진행중",
        "newValue": "완료",
        "createdAtISO": "2025-10-22T04:00:00.000Z"
      }
      // ... previous logs
    ]
  },
  "message": "Activity status updated successfully"
}
```

## 7. Add Sub-Activity

**POST** `/api/ir/activities/:id/sub-activities`

```bash
curl -X POST http://localhost:8080/api/ir/activities/act-1729584000000-abc123/sub-activities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "뉴욕 신규 투자 논의",
    "status": "예정",
    "startDatetime": "2025-10-25T01:00:00Z",
    "endDatetime": "2025-10-25T02:00:00Z",
    "allDay": false,
    "category": "외부",
    "location": "NYC",
    "description": "해외 투자자 초기 미팅",
    "typePrimary": "NDR",
    "typeSecondary": "해외",
    "ownerId": "USER_UUID_1",
    "kbParticipants": [
      { "userId": "USER_UUID_1", "role": "주관" }
    ],
    "visitors": [
      { "visitorName": "NewInvestor Corp", "visitorType": "investor" }
    ],
    "keywords": ["해외", "초기"]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sub-1729584004000-mno678",
    "title": "뉴욕 신규 투자 논의",
    "owner": "김민수",
    "status": "예정",
    "startDatetime": "2025-10-25T01:00:00.000Z",
    "endDatetime": "2025-10-25T02:00:00.000Z",
    "allDay": false,
    "category": "외부",
    "location": "NYC",
    "description": "해외 투자자 초기 미팅",
    "typePrimary": "NDR",
    "typeSecondary": "해외"
  },
  "message": "Sub-activity added successfully"
}
```

## 8. Delete Activity

**DELETE** `/api/ir/activities/:id`

```bash
curl -X DELETE http://localhost:8080/api/ir/activities/act-1729584000000-abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** 204 No Content (empty body)

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Access denied. Please login.",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "IR Activity with ID act-123 not found",
  "error": "Not Found"
}
```

### 400 Bad Request (Validation Error)
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "path": ["startDatetime"],
      "message": "Invalid datetime string! Must be UTC."
    },
    {
      "path": ["category"],
      "message": "Invalid enum value. Expected '내부' | '외부' | '휴가' | '공휴일'"
    }
  ]
}
```

## Testing with cURL

Example workflow to test all endpoints:

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.data.accessToken')

# 2. Create activity
ACTIVITY_ID=$(curl -X POST http://localhost:8080/api/ir/activities \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}' | jq -r '.data.id')

# 3. Get activity details
curl -X GET http://localhost:8080/api/ir/activities/$ACTIVITY_ID \
  -H "Authorization: Bearer $TOKEN"

# 4. Update status
curl -X PATCH http://localhost:8080/api/ir/activities/$ACTIVITY_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"진행중"}'

# 5. Get calendar events
curl -X GET "http://localhost:8080/api/ir/calendar/events?start=2025-10-01T00:00:00Z&end=2025-10-31T23:59:59Z" \
  -H "Authorization: Bearer $TOKEN"
```

## Swagger Documentation

When running in development mode, API documentation is available at:

```
http://localhost:8080/docs
```

This provides an interactive UI to test all endpoints without writing curl commands.
