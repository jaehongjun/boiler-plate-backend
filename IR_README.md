# Unified IR Activity Mock Data

## Overview

This directory contains the **single source of truth** for all IR (Investor Relations) activity mock data used across the application.

## File Structure

```
app/shared/mock/
└── irActivities.ts    # Unified mock data for all IR features
```

## Usage Across Features

### 1. IR Calendar (`app/features/ir/calendar/`)

**What it uses:**
- Full `IRActivityEntity` objects via `mockIrActivities`
- Converted to `IrCalendarEvent` via `toCalendarEvent()` mapping

**Where it's used:**
- `common/api/calendarService.ts` - Fetches events for calendar view
- `common/api/activityService.ts` - Fetches activity details for modal

**Components:**
- `IrCalendarBoard.tsx` - Calendar grid view
- `IrActivityDetailModal.tsx` - Full activity details with editing
- `AddIrActivityModal.tsx` - Create new activities

### 2. IR Timeline (`app/features/ir/timeline/`)

**What it uses:**
- `IRActivityEntity` grouped by investor/broker via `groupActivitiesForTimeline()`
- Main IR activities (e.g., "정기 IR 미팅") shown as rows
- `subActivities` (e.g., "Morgan Capital 미팅") shown as indented rows when group is expanded

**Timeline Structure (NO investor grouping):**
```
📁 정기 IR 미팅 (main activity, collapsed)
  └─ [Shows main activity bar]

📂 정기 IR 미팅 (main activity, expanded)
  ├─ Morgan Capital 미팅 (sub-activity, indented)
  ├─ 뉴욕 신규 투자 논의 (sub-activity, indented)
  └─ 투자 계약서 검토 (sub-activity, indented)

📁 투자 브리핑 (main activity, collapsed)
📂 투자 브리핑 (main activity, expanded)
  ├─ DEF펀드 미팅 (sub-activity, indented)
  └─ GHI자산운용 미팅 (sub-activity, indented)

📁 정기면담 (main activity)
📁 JP Morgan 담당자 미팅 (main activity)
📁 홍콩 IR 세션 (main activity)
📁 주간업무 회의 (main activity)
```

**Where it's used:**
- `common/mock/activities.ts` - Converts unified data to timeline format
- `ui/TimelineRow.tsx` - Accesses subActivities via `getIrActivityById()`

**Components:**
- `TimelineGrid.tsx` - Horizontal timeline view
- `TimelineRow.tsx` - Group row with collapsible main activities and sub-activities
- `TimelineBar.tsx` - Draggable/resizable bars

### 3. IR Activity Detail Modal

**What it uses:**
- Full `IRActivityEntity` with all fields:
  - Basic info: title, dates, location, type, status
  - Participants: kbs (KB staff), visitors (investors/brokers)
  - Content: memo, contentHtml, keywords
  - Attachments: files with metadata
  - **Sub-activities**: Detailed activities within main activity
  - Activity logs: Audit trail

## Data Structure

### IRActivityEntity

The complete entity type defined in `app/features/ir/calendar/common/model/activity.ts`:

```typescript
interface IRActivityEntity {
  // Core fields
  id: string;
  title: string;
  startISO: string;        // UTC ISO
  endISO?: string;         // UTC ISO
  status: "예정" | "진행중" | "완료" | "중단";

  // Calendar display
  allDay?: boolean;
  category: "내부" | "외부" | "휴가" | "공휴일";
  location?: string;
  description?: string;

  // Activity details
  typePrimary: string;     // e.g., "NDR"
  typeSecondary?: string;  // e.g., "전략회의"
  kbs: string[];           // KB staff
  visitors: string[];      // Investors/brokers
  memo?: string;           // Rich text
  files?: { id, name, url }[];

  // Extended details
  keywords?: string[];
  contentHtml?: string;
  attachments?: { id, name, url, size, uploadedAtISO, uploadedBy, mime }[];

  // 🔑 Sub-activities (for timeline detailed rows)
  subActivities?: {
    id: string;
    title: string;
    owner?: string;
    status: IRStatus;
  }[];

  // Metadata
  owner?: string;
  investors?: string[];
  brokers?: string[];
  logs?: { id, type, user, message, createdAtISO }[];
  createdAtISO?: string;
  updatedAtISO?: string;
  resolvedAtISO?: string;
}
```

## Timeline Integration

### Main Activity → Sub-Activities Hierarchy (2-Level)

Timeline displays a **2-level hierarchy** (NO investor grouping):

1. **Main IR Activity**: "정기 IR 미팅", "투자 브리핑", "정기면담" (top-level rows)
   - **Collapsed**: Shows main activity bar only
   - **Expanded**: Shows sub-activities below
   - Each main activity is a separate top-level row

2. **Sub-Activities**: "Morgan Capital 미팅", "뉴욕 신규 투자 논의"
   - Shown indented (left padding `pl-8`) under main activity
   - Each has its own timeline bar
   - Inherits date range from parent activity
   - Only visible when main activity is expanded

### Visual Structure

```
📁 정기 IR 미팅 (collapsed)
  └─ [main activity bar]

📂 정기 IR 미팅 (expanded)
  ├─   Morgan Capital 미팅 (sub-activity, indented)
  ├─   뉴욕 신규 투자 논의 (sub-activity, indented)
  └─   투자 계약서 검토 (sub-activity, indented)

📁 투자 브리핑 (collapsed)

📁 정기면담 (collapsed)

📁 JP Morgan 담당자 미팅 (collapsed)
```

### Example Data

```typescript
{
  id: "act-001",
  title: "정기 IR 미팅",              // Main activity (top-level row)
  startISO: "2025-10-22T00:00:00Z",
  endISO: "2025-10-24T00:00:00Z",
  status: "진행중",
  visitors: ["ABC투자사"],            // For reference only, NOT used for grouping

  subActivities: [                    // Shown as indented rows when expanded
    {
      id: "sub-001-1",
      title: "Morgan Capital 미팅",   // Sub-activity (indented)
      owner: "장도윤",
      status: "완료",
    },
    {
      id: "sub-001-2",
      title: "뉴욕 신규 투자 논의",   // Sub-activity (indented)
      owner: "김민수",
      status: "진행중",
    },
  ],
}

// Timeline view:
// 📁 정기 IR 미팅 (collapsed) → shows one main activity bar
// 📂 정기 IR 미팅 (expanded) → shows 3 sub-activity rows indented below
```

## Helper Functions

### `groupActivitiesForTimeline(activities: IRActivityEntity[]): IRTimelineGroup[]`

Converts IR activities to timeline groups. **Each main activity becomes a top-level row** (no investor grouping):
- Returns one group per main IR activity
- Group name = main activity title
- Sub-activities accessed via `getIrActivityById()` in UI

### `toCalendarEvent(activity: IRActivityEntity): IrCalendarEvent`

Converts full activity entity to simplified calendar event format.

## Benefits of Unified Mock

1. **Single Source of Truth**: All IR features use the same data
2. **Data Consistency**: No discrepancies between calendar, timeline, and detail views
3. **Easy Maintenance**: Update data in one place
4. **Type Safety**: Validated through `IRActivityEntity` interface
5. **Realistic Testing**: Full data structure with all relationships

## Adding New Mock Data

To add new IR activities:

1. Add to `mockIrActivities` array in `app/shared/mock/irActivities.ts`
2. Include all required fields (id, title, startISO, status, etc.)
3. Optionally add `subActivities` for timeline detailed view
4. Data will automatically appear in:
   - Calendar view (as calendar event)
   - Timeline view (as grouped activities with sub-activities)
   - Detail modal (with full information)

## Example: Adding New Activity

```typescript
{
  id: "act-007",
  title: "신규 투자자 미팅",
  startISO: addDays(today, 15),
  endISO: addDays(today, 16),
  category: "외부",
  status: "예정",
  typePrimary: "NDR",
  typeSecondary: "신규미팅",
  kbs: ["김민수"],
  visitors: ["NewInvestor Corp"],
  owner: "김민수",
  keywords: ["신규투자", "미국"],

  // Timeline will show these as detailed rows when expanded
  subActivities: [
    {
      id: "sub-007-1",
      title: "투자 제안서 발표",
      owner: "김민수",
      status: "예정",
    },
    {
      id: "sub-007-2",
      title: "Q&A 세션",
      owner: "김민수",
      status: "예정",
    },
  ],
}
```

---

# Backend Implementation Guide

이 섹션은 백엔드 개발자가 DB 스키마와 API를 설계할 때 참고할 수 있는 가이드입니다.

## Database Schema Requirements

### 1. Main Tables

#### `ir_activities` (Main IR Activities)

메인 IR 활동 테이블 - Timeline의 최상위 행이 되는 활동들

```sql
CREATE TABLE ir_activities (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Core Information
  title VARCHAR(255) NOT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('예정', '진행중', '완료', '중단')),

  -- Calendar Display
  all_day BOOLEAN DEFAULT FALSE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('내부', '외부', '휴가', '공휴일')),
  location VARCHAR(255),
  description TEXT,

  -- Activity Classification
  type_primary VARCHAR(50) NOT NULL,    -- e.g., "NDR", "컨퍼런스"
  type_secondary VARCHAR(50),           -- e.g., "전략회의", "브리핑"

  -- Rich Content
  memo TEXT,                            -- Plain text or simple HTML
  content_html TEXT,                    -- Rich HTML content

  -- Ownership
  owner_id VARCHAR(50),                 -- FK to users table

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Indexes
  INDEX idx_start_datetime (start_datetime),
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_owner (owner_id)
);
```

#### `ir_sub_activities` (Sub-Activities)

상세 활동 테이블 - Timeline에서 펼쳤을 때 나타나는 들여쓰기된 행들

```sql
CREATE TABLE ir_sub_activities (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Foreign Key to Parent Activity
  parent_activity_id VARCHAR(50) NOT NULL,

  -- Core Information
  title VARCHAR(255) NOT NULL,
  owner_id VARCHAR(50),                 -- FK to users table
  status VARCHAR(20) NOT NULL CHECK (status IN ('예정', '진행중', '완료', '중단')),

  -- Optional: Sub-activities can have their own dates
  -- If NULL, inherits from parent activity
  start_datetime TIMESTAMP WITH TIME ZONE,
  end_datetime TIMESTAMP WITH TIME ZONE,

  -- Display Order
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Foreign Keys
  FOREIGN KEY (parent_activity_id) REFERENCES ir_activities(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_parent_activity (parent_activity_id),
  INDEX idx_status (status)
);
```

### 2. Relationship Tables (Many-to-Many)

#### `ir_activity_kb_participants` (KB Staff Participants)

KB 직원 면담자 (many-to-many)

```sql
CREATE TABLE ir_activity_kb_participants (
  activity_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  role VARCHAR(50),                     -- e.g., "주관", "참석"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (activity_id, user_id),
  FOREIGN KEY (activity_id) REFERENCES ir_activities(id) ON DELETE CASCADE
);
```

#### `ir_activity_visitors` (External Visitors)

방문자 (투자자/증권사) - many-to-many

```sql
CREATE TABLE ir_activity_visitors (
  activity_id VARCHAR(50) NOT NULL,
  visitor_name VARCHAR(255) NOT NULL,
  visitor_type VARCHAR(20),              -- 'investor' or 'broker'
  company VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (activity_id, visitor_name),
  FOREIGN KEY (activity_id) REFERENCES ir_activities(id) ON DELETE CASCADE
);
```

#### `ir_activity_keywords` (Keywords/Tags)

키워드 (최대 5개)

```sql
CREATE TABLE ir_activity_keywords (
  activity_id VARCHAR(50) NOT NULL,
  keyword VARCHAR(50) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (activity_id, keyword),
  FOREIGN KEY (activity_id) REFERENCES ir_activities(id) ON DELETE CASCADE
);
```

### 3. Attachments & Files

#### `ir_activity_attachments` (File Attachments)

첨부파일 메타데이터

```sql
CREATE TABLE ir_activity_attachments (
  id VARCHAR(50) PRIMARY KEY,
  activity_id VARCHAR(50) NOT NULL,

  -- File Information
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,                      -- bytes
  mime_type VARCHAR(100),
  storage_url VARCHAR(500),              -- S3/CDN URL

  -- Upload Information
  uploaded_by VARCHAR(50),               -- FK to users
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Validation
  -- Max file size: 50MB per file, 500MB total per activity

  FOREIGN KEY (activity_id) REFERENCES ir_activities(id) ON DELETE CASCADE,
  INDEX idx_activity (activity_id)
);
```

### 4. Activity Logs (Audit Trail)

#### `ir_activity_logs` (Change History)

활동 기록 (변경 이력)

```sql
CREATE TABLE ir_activity_logs (
  id VARCHAR(50) PRIMARY KEY,
  activity_id VARCHAR(50) NOT NULL,

  -- Log Information
  log_type VARCHAR(50) NOT NULL,         -- 'create', 'update', 'status', 'title', 'attachment', etc.
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(100) NOT NULL,       -- Denormalized for display
  message TEXT NOT NULL,

  -- Optional: Store old/new values for detailed history
  old_value TEXT,
  new_value TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (activity_id) REFERENCES ir_activities(id) ON DELETE CASCADE,
  INDEX idx_activity (activity_id),
  INDEX idx_created_at (created_at)
);
```

## API Endpoints

### Calendar API

#### `GET /api/ir/calendar/events`

캘린더 이벤트 조회 (월/주 범위)

**Query Parameters:**
- `start` (required): ISO 8601 datetime (e.g., "2025-10-01T00:00:00Z")
- `end` (required): ISO 8601 datetime

**Response:**
```typescript
{
  events: Array<{
    id: string;
    title: string;
    start: string;          // ISO datetime
    end?: string;           // ISO datetime
    allDay?: boolean;
    category: "내부" | "외부" | "휴가" | "공휴일";
    location?: string;
    description?: string;
  }>
}
```

**SQL Query Example:**
```sql
SELECT
  id, title, start_datetime, end_datetime,
  all_day, category, location, description
FROM ir_activities
WHERE start_datetime < :end
  AND (end_datetime > :start OR end_datetime IS NULL)
ORDER BY start_datetime ASC;
```

### Activity Detail API

#### `GET /api/ir/activities/:id`

IR 활동 상세 조회 (Detail Modal용)

**Response:**
```typescript
{
  // Core fields
  id: string;
  title: string;
  startISO: string;
  endISO?: string;
  status: "예정" | "진행중" | "완료" | "중단";

  // Display
  allDay?: boolean;
  category: "내부" | "외부" | "휴가" | "공휴일";
  location?: string;
  description?: string;

  // Classification
  typePrimary: string;
  typeSecondary?: string;

  // Participants
  kbs: string[];              // Array of KB staff names
  visitors: string[];         // Array of visitor names

  // Content
  memo?: string;
  contentHtml?: string;
  keywords?: string[];        // Max 5

  // Attachments
  attachments?: Array<{
    id: string;
    name: string;
    url?: string;
    size?: number;
    uploadedAtISO?: string;
    uploadedBy?: string;
    mime?: string;
  }>;

  // Sub-activities (for Timeline)
  subActivities?: Array<{
    id: string;
    title: string;
    owner?: string;
    status: "예정" | "진행중" | "완료" | "중단";
  }>;

  // Metadata
  owner?: string;
  logs?: Array<{
    id: string;
    type: string;
    user: string;
    message: string;
    createdAtISO: string;
  }>;
  createdAtISO?: string;
  updatedAtISO?: string;
  resolvedAtISO?: string;
}
```

**SQL Query Example (with JOINs):**
```sql
-- Main activity
SELECT * FROM ir_activities WHERE id = :id;

-- KB participants
SELECT user_name FROM ir_activity_kb_participants
  JOIN users ON user_id = users.id
  WHERE activity_id = :id;

-- Visitors
SELECT visitor_name FROM ir_activity_visitors
  WHERE activity_id = :id;

-- Keywords
SELECT keyword FROM ir_activity_keywords
  WHERE activity_id = :id
  ORDER BY display_order;

-- Sub-activities
SELECT id, title, owner_id, status
  FROM ir_sub_activities
  WHERE parent_activity_id = :id
  ORDER BY display_order;

-- Attachments
SELECT * FROM ir_activity_attachments
  WHERE activity_id = :id;

-- Logs
SELECT * FROM ir_activity_logs
  WHERE activity_id = :id
  ORDER BY created_at DESC
  LIMIT 200;
```

### Timeline API

#### `GET /api/ir/timeline/activities`

타임라인 활동 목록 조회

**Query Parameters:**
- `start` (required): ISO datetime
- `end` (required): ISO datetime
- `status?`: Filter by status ("예정" | "진행중" | "완료" | "중단" | "전체")

**Response:**
```typescript
{
  activities: Array<{
    id: string;
    title: string;              // Main activity title (top-level row)
    startISO: string;
    endISO: string;
    status: "예정" | "진행중" | "완료" | "중단";

    // Sub-activities shown when expanded
    subActivities?: Array<{
      id: string;
      title: string;
      owner?: string;
      status: "예정" | "진행중" | "완료" | "중단";
    }>;
  }>
}
```

### CRUD Operations

#### `POST /api/ir/activities`

Create new IR activity

**Request Body:** Same as `IRActivityEntity` (excluding `id`, timestamps)

#### `PATCH /api/ir/activities/:id`

Update IR activity (partial update)

**Request Body:** Partial `IRActivityEntity`

#### `DELETE /api/ir/activities/:id`

Delete IR activity (cascade deletes sub-activities, attachments, etc.)

#### `PATCH /api/ir/activities/:id/status`

Update activity status

**Request Body:**
```typescript
{
  status: "예정" | "진행중" | "완료" | "중단";
}
```

#### `POST /api/ir/activities/:id/sub-activities`

Add sub-activity

**Request Body:**
```typescript
{
  title: string;
  owner?: string;
  status: "예정" | "진행중" | "완료" | "중단";
}
```

#### `POST /api/ir/activities/:id/attachments`

Upload attachment (multipart/form-data)

**Validation:**
- Max file size: 50MB per file
- Total size per activity: 500MB
- Allowed types: pdf, pptx, xlsx, docx, png, jpg, jpeg

## Business Rules

### Activity Status Flow
```
예정 → 진행중 → 완료
  ↓      ↓
중단 ← 중단
```

### Constraints

1. **Keywords**: Max 5 per activity
2. **File Size**:
   - Per file: 50MB
   - Per activity: 500MB total
3. **Allowed File Types**: pdf, pptx, xlsx, docx, png, jpg, jpeg
4. **KB Participants**: Max 50
5. **Visitors**: Max 50
6. **Sub-activities**: No hard limit, but UI shows all when expanded

### Date/Time Handling

- **All dates stored in UTC** (TIMESTAMP WITH TIME ZONE)
- **Frontend displays in Asia/Seoul timezone** (KST, UTC+9)
- **API accepts/returns ISO 8601 format**: "2025-10-22T00:00:00Z"

### Activity Logs

Automatically create logs for:
- Activity creation
- Title changes
- Status changes
- Attachment uploads/deletes
- Sub-activity additions
- Keyword updates

## Data Migration Notes

When migrating from mock to database:

1. **ID Format**: Currently using strings like "act-001", "sub-001-1"
   - Consider using UUID v4 or ULID for production
   - Or keep readable format: "act-{timestamp}-{random}"

2. **Visitors**: Currently stored as string array
   - Consider normalizing to separate `companies` and `contacts` tables
   - For v1, string array is acceptable

3. **Files Array**: Mock has simplified `files` array
   - Production should use full `attachments` with metadata

4. **Timezone**: Mock uses `.toISOString()`
   - Ensure backend stores as UTC
   - Frontend handles KST conversion

## Performance Considerations

1. **Indexes**:
   - `start_datetime` for date range queries
   - `status` for filtering
   - `category` for calendar filtering
   - Composite index on `(start_datetime, status)` for timeline queries

2. **Pagination**:
   - Calendar: Usually 1 month window, no pagination needed
   - Timeline: Usually 1-2 months, consider cursor-based pagination
   - Activity logs: Limit to last 200 entries

3. **N+1 Queries**:
   - Use JOINs or batch queries for participants, keywords, attachments
   - Consider GraphQL or response caching

4. **File Storage**:
   - Use S3 or CDN for attachments
   - Store only metadata in database
   - Generate pre-signed URLs for downloads

## Future Enhancements

1. **Full-text Search**: Add search on title, content, participants
2. **Recurring Activities**: Support for weekly/monthly recurring events
3. **Notifications**: Email/push notifications for status changes
4. **Permissions**: Role-based access control (viewer, editor, admin)
5. **Export**: Export activities to Excel/PDF
6. **Calendar Sync**: iCal/Google Calendar integration
