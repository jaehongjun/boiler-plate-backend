# IR 활동 생성 + 파일 업로드 연동 (포트 8080)

본 서버는 Supabase Storage 기반 파일 업로드와 IR 활동 생성 API를 제공합니다. 프론트는 CSR(XHR) 업로드를 사용합니다.

## 베이스 URL
- Local: http://localhost:8080
- 프론트 .env 예시
  - VITE_API_BASE_URL=http://localhost:8080
  - (선택) VITE_FILE_UPLOAD_URL=http://localhost:8080/api/files/upload

VITE_FILE_UPLOAD_URL이 없으면 프론트는 `${VITE_API_BASE_URL}/uploads` 로 업로드 요청을 보냅니다.

## 1) 파일 업로드 API
- 메서드: POST
- 경로(둘 중 택1):
  - 기본: POST http://localhost:8080/uploads
  - 대안: POST http://localhost:8080/api/files/upload
- 인증: 필요 시 Authorization: Bearer <token> 헤더 첨부 (OptionalJwtAuthGuard 적용)
- Content-Type: multipart/form-data
- 필드명: file

응답(권장):
```
{
  "id": "a1b2c3d4",
  "filename": "report.pdf",
  "url": "https://...",
  "size": 123456,
  "contentType": "application/pdf",
  "meta": {}
}
```

예시 cURL:
```
curl -X POST \
  http://localhost:8080/uploads \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@/path/to/file.pdf"
```

Supabase 설정:
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (권장) 또는 SUPABASE_ANON_KEY
- SUPABASE_STORAGE_BUCKET (기본값: uploads)
- 버킷을 Public으로 설정하거나, Public URL 또는 Signed URL 정책을 적절히 구성하세요.

## 2) IR 활동 생성 API
- 메서드: POST
- 경로(둘 중 택1):
  - 기본: POST http://localhost:8080/ir/activities
  - 대안: POST http://localhost:8080/api/ir/activities
- Content-Type: application/json
- 인증: 필요 시 Authorization: Bearer <token>

요청 바디:
```
{
  "title": "ABC 투자 미팅",
  "type": "MEETING",
  "meetingAt": "2025-10-13T09:30:00.000Z",
  "place": "강남 본사 12F",
  "broker": "KB증권",
  "brokerPerson": "유지현 부장",
  "investor": "ABC investment",
  "investorPerson": "Alba chunkook CEO",
  "attachments": [ { "filename": "agenda.pdf", "url": "https://...", "id": "a1b2" } ]
}
```

응답(권장 공통 형태):
```
{
  "success": true,
  "data": { ... 생성된 활동 ... },
  "message": "CREATED"
}
```

비고:
- meetingAt은 ISO 문자열
- attachments는 업로드 API 응답을 그대로 매핑(최소 filename, url)
- 현재는 메모리 저장이며, 추후 DB 연동 시 스키마에 맞춰 저장 로직 교체 필요

## 3) 서버 포트 및 CORS
- 기본 포트: 8080 (env PORT로 변경 가능)
- CORS: origin: true, Authorization 헤더 허용
- 전역 prefix는 `api` 이며, 다음 경로는 prefix 예외로 루트에서도 접근 가능:
  - POST /uploads
  - POST /ir/activities

## 4) 환경 변수(.env 예시)
```
PORT=8080
NODE_ENV=development
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
# 또는 (버킷 정책 허용 시)
# SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_STORAGE_BUCKET=uploads
```

## 5) 체크리스트
- [ ] 업로드 크기 제한(기본 50MB)
- [ ] 허용 MIME/확장자 검토(image/*, application/pdf 등)
- [ ] 버킷 공개 URL 또는 Signed URL 구성
- [ ] 인증/인가 정책 점검(OptionalJwtAuthGuard→필요 시 JwtAuthGuard로 교체)
- [ ] 프론트 .env의 VITE_API_BASE_URL, VITE_FILE_UPLOAD_URL 설정 확인
