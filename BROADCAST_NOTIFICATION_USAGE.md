# Broadcast Notification 사용 가이드

## 개요

모든 유저에게 알림을 전송하는 broadcast 기능이 추가되었습니다.

## API 엔드포인트

### POST `/api/notifications/broadcast`

모든 유저에게 알림을 전송합니다.

**Request:**

```bash
POST http://localhost:3000/api/notifications/broadcast
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "eventType": "SYSTEM_ANNOUNCEMENT",
  "title": "시스템 점검 안내: 2025-11-15 02:00-04:00",
  "metadata": {
    "maintenanceStart": "2025-11-15T02:00:00Z",
    "maintenanceEnd": "2025-11-15T04:00:00Z"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sent": 50,
    "totalUsers": 50,
    "message": "Successfully sent notification to 50 users"
  },
  "message": "Successfully sent notification to 50 users"
}
```

## 사용 예시

### 1. 시스템 공지사항

```typescript
// 시스템 점검 안내
await fetch('http://localhost:3000/api/notifications/broadcast', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    eventType: 'SYSTEM_ANNOUNCEMENT',
    title: '시스템 점검 안내: 2025-11-15 02:00-04:00',
    metadata: {
      maintenanceStart: '2025-11-15T02:00:00Z',
      maintenanceEnd: '2025-11-15T04:00:00Z',
    },
  }),
});
```

### 2. 긴급 공지

```typescript
// 긴급 공지
await fetch('http://localhost:3000/api/notifications/broadcast', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    eventType: 'SYSTEM_ANNOUNCEMENT',
    title: '긴급: 보안 업데이트 필수 설치 안내',
    metadata: {
      priority: 'high',
      actionRequired: true,
    },
  }),
});
```

### 3. 서비스 내에서 사용

```typescript
// notification.service.ts에서 직접 호출
import { Injectable } from '@nestjs/common';
import { NotificationService } from './notification/notification.service';
import { NotificationEventType } from './database/schemas/notification.schema';

@Injectable()
export class SomeService {
  constructor(private notificationService: NotificationService) {}

  async announceSystemUpdate() {
    await this.notificationService.broadcast({
      eventType: NotificationEventType.SYSTEM_ANNOUNCEMENT,
      title: '새로운 기능이 추가되었습니다!',
      metadata: {
        features: ['IR Timeline 개선', 'Investor 검색 강화'],
      },
    });
  }
}
```

## 이벤트 타입

### 시스템 알림
- `SYSTEM_ANNOUNCEMENT` - 일반 공지사항
- `SYSTEM_MAINTENANCE` - 시스템 점검 안내

### IR 활동 알림
- `IR_ACTIVITY_CREATED` - IR 활동 생성
- `IR_ACTIVITY_UPDATED` - IR 활동 수정
- `IR_ACTIVITY_FIELD_UPDATED` - IR 활동 필드 수정
- `IR_ACTIVITY_DELETED` - IR 활동 삭제

### 투자자 알림
- `INVESTOR_BULK_UPDATED` - 투자자 대량 업데이트
- `INVESTOR_UPDATED` - 투자자 업데이트

### 출장 알림
- `TRIP_CREATED` - 출장 생성
- `TRIP_UPDATED` - 출장 수정

## 성능 최적화

- **Batch 처리**: 1000명 단위로 나눠서 insert (PostgreSQL parameter limit 방지)
- **대량 유저 대응**: 10,000명 유저에게도 안정적으로 전송 가능
- **비동기 처리**: 알림 전송은 비동기로 처리되어 API 응답이 빠름

## 주의사항

1. **권한 관리**: 현재는 JWT 인증만 필요하지만, 추후 Admin 권한 체크를 추가할 수 있습니다.
2. **알림 폭탄 방지**: 너무 자주 broadcast하지 않도록 주의하세요.
3. **메타데이터**: metadata는 선택사항이지만, 프론트엔드에서 활용할 수 있도록 충분한 정보를 담는 것이 좋습니다.

## 기타 알림 API

### 내 알림 조회
```bash
GET /api/notifications?unreadOnly=true
```

### 안읽은 알림 개수
```bash
GET /api/notifications/unread-count
```

### 알림 읽음 처리
```bash
PATCH /api/notifications/:id/read
```

### 모든 알림 읽음 처리
```bash
PATCH /api/notifications/read-all
```

### 알림 삭제
```bash
DELETE /api/notifications/:id
```
