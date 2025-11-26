# Participation Tracking - Implementation Documentation

**Status:** ✅ MVP Complete  
**Date:** November 25, 2025  
**Version:** 0.2.0

---

## Overview

The Participation Tracking feature provides comprehensive monitoring and analytics for student engagement during class sessions. This feature is **entirely data-driven** - the web app displays and analyzes participation data captured by the browser extension.

### Key Philosophy
- **Extension Captures:** Chat messages, reactions, mic toggles, camera toggles, and other interactions
- **Backend Stores:** All participation events with timestamps and metadata
- **Web App Displays:** Real-time monitoring, historical analysis, and engagement insights

### Core Principles
✅ **Professor-Sided Tool** - No student interaction required  
✅ **Data Display & Analysis** - Focus on monitoring and reporting  
✅ **Extension-Driven** - All data captured automatically during sessions  
✅ **Manual Refresh** - MVP uses manual refresh for data updates  
✅ **Simple & Clean** - Minimalist UI focused on essential information

---

## Database Schema

### Table: **participation_logs**

Stores individual participation events captured during sessions.

**Columns:**
- `id` (UUID, PK) - Unique log identifier
- `session_id` (UUID, FK → sessions, CASCADE DELETE) - Associated session
- `student_id` (UUID, FK → students, CASCADE DELETE) - Participating student
- `interaction_type` (ENUM) - Type of interaction
- `interaction_value` (VARCHAR 255) - Content/value of interaction
- `timestamp` (TIMESTAMP) - When interaction occurred
- `additional_data` (JSONB) - Extra metadata (flexible)

**Interaction Types (ENUM):**
- `manual_entry` - Instructor-added note (future feature)
- `chat` - Chat message sent
- `reaction` - Reaction/emoji used
- `mic_toggle` - Microphone on/off event
- `camera_toggle` - Camera on/off event

**Indexes:**
- `idx_participation_logs_session_id` - Fast session queries
- `idx_participation_logs_student_id` - Fast student queries
- `idx_participation_logs_timestamp` - Chronological ordering
- `idx_participation_logs_interaction_type` - Filter by type

**Example Records:**
```sql
-- Chat message
{
  session_id: "abc-123",
  student_id: "def-456",
  interaction_type: "chat",
  interaction_value: "Great explanation!",
  timestamp: "2025-11-25 14:23:45",
  additional_data: { "message_length": 19 }
}

-- Mic toggle
{
  session_id: "abc-123",
  student_id: "def-456",
  interaction_type: "mic_toggle",
  interaction_value: "on",
  timestamp: "2025-11-25 14:25:12",
  additional_data: { "duration_seconds": 45 }
}
```

---

## Backend Implementation

### Model: **ParticipationLog** (`backend/src/models/ParticipationLog.js`)

**Methods:**

#### 1. **create(logData)**
Creates a single participation log entry.

**Parameters:**
- `session_id` (UUID, required)
- `student_id` (UUID, required)
- `interaction_type` (string, required)
- `interaction_value` (string, optional)
- `additional_data` (object, optional)

**Returns:** Created log record

---

#### 2. **findBySessionId(sessionId, options)**
Retrieves all logs for a specific session.

**Options:**
- `limit` (default: 100)
- `offset` (default: 0)
- `interaction_type` (filter by specific type)

**Returns:** Array of logs with student info (JOIN with students table)

**Includes:**
- Log data + first_name, last_name, student_id

---

#### 3. **findBySessionIdWithPagination(sessionId, page, limit)**
Paginated log retrieval with metadata.

**Returns:**
```javascript
{
  data: [...logs],
  pagination: {
    page: 1,
    limit: 50,
    total: 234,
    totalPages: 5
  }
}
```

---

#### 4. **findByStudentId(studentId, options)**
Retrieves participation history for a specific student.

**Returns:** Logs with session and class information (JOINs)

---

#### 5. **getSessionInteractionSummary(sessionId)**
Aggregated statistics by interaction type.

**Returns:**
```javascript
[
  { interaction_type: 'chat', count: 45, unique_students: 12 },
  { interaction_type: 'reaction', count: 23, unique_students: 8 },
  { interaction_type: 'mic_toggle', count: 34, unique_students: 15 }
]
```

---

#### 6. **getStudentSessionSummary(sessionId)**
Per-student participation breakdown for a session.

**Returns:**
```javascript
[
  {
    student_id: "uuid",
    first_name: "John",
    last_name: "Doe",
    student_id: "12345",
    total_interactions: 8,
    manual_entries: 0,
    chat_messages: 3,
    reactions: 2,
    last_interaction: "2025-11-25 14:30:00"
  }
]
```

**Includes all students in class** - even those with 0 interactions (LEFT JOIN)

---

#### 7. **getRecentActivity(sessionId, minutes)**
Retrieves recent activity within a time window.

**Default:** Last 5 minutes  
**Use Case:** Live monitoring during active sessions

---

#### 8. **deleteBySessionId(sessionId)**
Cascading delete - removes all logs when session is deleted.

**Returns:** Number of rows deleted

---

## Backend API Endpoints

### Controller: **participationController** (`backend/src/controllers/participationController.js`)

All routes require **instructor authentication** (`instructorAuth` middleware).

---

### **GET** `/api/participation/sessions/:sessionId/logs`

Get participation logs for a session.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `interaction_type` (string, optional) - Filter by type

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [...logs],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 234,
      "totalPages": 5
    }
  }
}
```

**Access Control:**
- Verifies session exists
- Checks instructor owns the session's class
- Admins can access any session

---

### **POST** `/api/participation/sessions/:sessionId/logs`

Add a single participation log (manual entry).

**Body:**
```json
{
  "student_id": "uuid",
  "interaction_type": "manual_entry",
  "interaction_value": "Excellent question about algorithms",
  "additional_data": { "context": "In-class discussion" }
}
```

**Validation:**
- Session must exist and be active
- Student must exist and belong to session's class
- Interaction type must be valid enum value

**Response:**
```json
{
  "success": true,
  "data": { ...created_log },
  "message": "Participation log added successfully"
}
```

**Real-Time:** Emits socket event `participation:added`

---

### **POST** `/api/participation/sessions/:sessionId/logs/bulk`

Add multiple participation logs at once (extension endpoint).

**Body:**
```json
{
  "logs": [
    {
      "student_id": "uuid",
      "interaction_type": "chat",
      "interaction_value": "Message content",
      "additional_data": {}
    },
    ...
  ]
}
```

**Validation:** Each log validated individually  
**Error Handling:** Partial success - returns successful and failed logs separately

**Response:**
```json
{
  "success": true,
  "data": {
    "added": 45,
    "failed": 2,
    "errors": [...error_details],
    "results": [...created_logs]
  },
  "message": "Added 45 participation logs successfully"
}
```

**Real-Time:** Emits socket event `participation:bulk_added`

---

### **GET** `/api/participation/sessions/:sessionId/summary`

Get comprehensive participation summary with statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "session": { ...session_info },
    "stats": {
      "total_students": 25,
      "participated_students": 18,
      "total_participation": 156
    },
    "interactionSummary": [
      { "interaction_type": "chat", "count": 45, "unique_students": 12 }
    ],
    "studentSummary": [
      {
        "student_id": "uuid",
        "first_name": "John",
        "last_name": "Doe",
        "total_interactions": 8,
        "chat_messages": 3,
        "reactions": 2,
        ...
      }
    ]
  }
}
```

**Combines:**
- Session details
- Overall statistics
- Interaction type breakdown
- Per-student breakdown

---

### **GET** `/api/participation/sessions/:sessionId/recent`

Get recent participation activity.

**Query Parameters:**
- `minutes` (number, default: 5)

**Response:**
```json
{
  "success": true,
  "data": [...recent_logs]
}
```

**Use Case:** Live activity monitoring during active sessions

---

## Frontend Implementation

### Pages

#### **SessionDetailPage** (`frontend/src/pages/SessionDetailPage.jsx`)

Enhanced session detail page with participation tab.

**Features:**
- Tab navigation: Attendance | Participation
- Loads participation data when tab is active
- Integrates all participation components
- Manual refresh functionality

**State Management:**
```javascript
const [activeTab, setActiveTab] = useState('attendance');
const [searchTerm, setSearchTerm] = useState('');
const [selectedType, setSelectedType] = useState('');
```

**Queries:**
- `participationData` - Summary stats and breakdowns
- `participationLogsData` - Full log list with pagination

---

### Components

#### 1. **InteractionTypeBadge** (`components/Participation/InteractionTypeBadge.jsx`)

Reusable badge component for displaying interaction types.

**Props:**
- `type` (string) - Interaction type
- `size` ('sm' | 'md' | 'lg') - Badge size

**Features:**
- Icon per interaction type
- Color-coded by type
- Responsive sizing

**Type Styling:**
| Type | Color | Icon |
|------|-------|------|
| chat | Blue | ChatBubbleLeftIcon |
| reaction | Yellow | FaceSmileIcon |
| mic_toggle | Green | MicrophoneIcon |
| camera_toggle | Purple | VideoCameraIcon |
| manual_entry | Gray | PencilSquareIcon |

---

#### 2. **ParticipationSummary** (`components/Participation/ParticipationSummary.jsx`)

Statistics dashboard showing participation overview.

**Props:**
- `summary` (object) - Session summary data
- `interactionSummary` (array) - Type breakdown

**Display Sections:**

**Main Stats (4 cards):**
1. Total Interactions - Count of all events
2. Students Participated - X / Y students
3. Participation Rate - Percentage with progress bar
4. Most Active Student - Top participant

**Interaction Breakdown:**
- Chart, Reaction, Mic Toggle, Camera Toggle
- Count and percentage per type
- Progress bars for visual representation

**Empty State:** Displays when no data available

---

#### 3. **ParticipationFilters** (`components/Participation/ParticipationFilters.jsx`)

Filter and search bar for participation logs.

**Props:**
- `searchTerm` (string)
- `onSearchChange` (function)
- `selectedType` (string)
- `onTypeChange` (function)
- `onRefresh` (function)
- `isRefreshing` (boolean)

**Features:**
- Search input (student name)
- Type filter dropdown
- Refresh button (with loading state)
- Active filters display with clear options
- Responsive layout

**Filter Options:**
- All Types
- Chat
- Reaction
- Mic Toggle
- Camera Toggle
- Manual Entry

---

#### 4. **ParticipationLogsList** (`components/Participation/ParticipationLogsList.jsx`)

Main table displaying individual participation logs.

**Props:**
- `logs` (array) - Participation logs to display
- `isLoading` (boolean)

**Features:**

**Table Columns:**
1. Student Name (sortable)
   - Last, First name format
   - Student ID displayed below
2. Interaction Type (sortable)
   - Displays as badge
3. Value (sortable)
   - Truncated if too long
4. Timestamp (sortable)
   - Formatted: Nov 25, 02:30:45 PM
5. Additional Data
   - Expandable JSON view
   - Click to show/hide

**Sorting:**
- Click column headers to sort
- Toggle ascending/descending
- Visual indicators (chevron icons)
- Remembers sort state

**Pagination:**
- 50 logs per page
- First/Previous/Next/Last controls
- Smart page number display (1 ... 5 6 7 ... 20)
- Shows current range (e.g., "Showing 51 to 100 of 234 logs")

**Row Expansion:**
- Click "View" to expand additional_data
- Formatted JSON display
- Click "Hide" to collapse

**Empty State:**
- Displays when no logs exist
- Helpful message about extension capture

**Loading State:**
- Spinner during data fetch

---

## Data Flow

### Typical Usage Flow

1. **Extension Captures Events**
   - Student sends chat message in Google Meet
   - Extension detects event and stores locally

2. **Extension Submits to Backend**
   - POST `/api/participation/sessions/:sessionId/logs/bulk`
   - Batch submission for efficiency

3. **Backend Stores Data**
   - Validates each log entry
   - Stores in `participation_logs` table
   - Returns success/failure counts

4. **Instructor Views Data**
   - Opens session detail page
   - Clicks "Participation" tab
   - Data loads automatically

5. **Instructor Analyzes**
   - Reviews summary statistics
   - Filters by interaction type
   - Searches for specific students
   - Sorts by timestamp
   - Expands additional data as needed

6. **Instructor Refreshes**
   - Clicks "Refresh" button to get latest data
   - Manual refresh ensures control over data fetching

---

## Features in MVP

### ✅ Implemented

1. **Data Display**
   - Comprehensive logs table
   - Summary statistics
   - Interaction type breakdown
   - Per-student summaries

2. **Filtering & Search**
   - Filter by interaction type
   - Search by student name
   - Clear filters easily

3. **Sorting**
   - Sort by any column
   - Toggle ascending/descending
   - Visual sort indicators

4. **Pagination**
   - 50 logs per page
   - Smart navigation controls
   - Current range display

5. **Data Exploration**
   - Expandable additional_data
   - Formatted JSON display
   - Truncated values for readability

6. **Manual Refresh**
   - Refresh button with loading state
   - Controlled data fetching
   - Updates summary and logs

7. **Empty States**
   - Helpful messages when no data
   - Loading indicators
   - Clear visual feedback

8. **Responsive Design**
   - Mobile-friendly layouts
   - Flexible components
   - Clean modern UI

---

## Features NOT in MVP

### ❌ Not Implemented (Future)

1. **Manual Entry**
   - No UI for instructors to add logs
   - All data from extension only

2. **Real-Time Updates**
   - No auto-refresh
   - No WebSocket live updates
   - Manual refresh required

3. **Advanced Visualizations**
   - No charts or graphs
   - Simple statistics only
   - Raw data display

4. **Export Features**
   - No CSV export
   - No PDF reports
   - View-only for MVP

5. **Engagement Scoring**
   - No weighted scoring
   - No quality metrics
   - Raw counts only

6. **Bulk Operations**
   - No bulk edit
   - No bulk delete
   - View-only interface

7. **Advanced Analytics**
   - No trend analysis
   - No predictions
   - No correlations
   - Basic stats only

---

## Technical Notes

### Performance Considerations

**Pagination:**
- Frontend pagination (50 items/page)
- Backend supports limit/offset
- Keeps UI responsive with large datasets

**Filtering:**
- Client-side search filtering
- Server-side type filtering
- Balanced approach for performance

**Caching:**
- React Query handles caching
- Manual refresh invalidates cache
- Reduces unnecessary API calls

### Data Validation

**Backend Validation:**
- Session must exist and be active
- Student must exist in session's class
- Interaction type must be valid enum
- Individual log validation in bulk operations

**Frontend Validation:**
- Type-safe props
- Graceful handling of missing data
- Empty state displays

### Security

**Access Control:**
- All routes require authentication
- Instructors can only access their sessions
- Admins have full access
- Student data protected

**Data Integrity:**
- Foreign key constraints
- Cascade deletes
- Unique constraints where needed
- JSONB validation for additional_data

---

## API Service Integration

### Frontend API Service (`frontend/src/services/api.js`)

```javascript
export const participationAPI = {
  getLogs: (sessionId, params = {}) =>
    api.get(`/participation/sessions/${sessionId}/logs`, { params }),
    
  addLog: (sessionId, logData) =>
    api.post(`/participation/sessions/${sessionId}/logs`, logData),
    
  addBulkLogs: (sessionId, logs) =>
    api.post(`/participation/sessions/${sessionId}/logs/bulk`, { logs }),
    
  getSummary: (sessionId) =>
    api.get(`/participation/sessions/${sessionId}/summary`),
    
  getRecentActivity: (sessionId, minutes = 5) =>
    api.get(`/participation/sessions/${sessionId}/recent?minutes=${minutes}`),
};
```

---

## Testing Checklist

### Backend Testing

- [ ] Create participation log successfully
- [ ] Reject log for non-existent session
- [ ] Reject log for non-existent student
- [ ] Reject log with invalid interaction type
- [ ] Bulk create with partial failures
- [ ] Get logs with pagination
- [ ] Filter logs by interaction type
- [ ] Get session summary with correct stats
- [ ] Get interaction type breakdown
- [ ] Get per-student summary
- [ ] Recent activity within time window
- [ ] Access control - own sessions only
- [ ] Access control - admin access
- [ ] Cascade delete with session

### Frontend Testing

- [ ] Display summary statistics correctly
- [ ] Show interaction type breakdown
- [ ] Display participation logs table
- [ ] Sort by each column
- [ ] Toggle sort direction
- [ ] Search by student name
- [ ] Filter by interaction type
- [ ] Clear individual filters
- [ ] Clear all filters
- [ ] Pagination navigation
- [ ] Expand/collapse additional data
- [ ] Refresh button updates data
- [ ] Loading states display
- [ ] Empty states display
- [ ] Responsive on mobile
- [ ] Badge colors correct per type

### Integration Testing

- [ ] Extension submits bulk logs
- [ ] Backend stores logs correctly
- [ ] Frontend displays new logs after refresh
- [ ] Summary updates with new data
- [ ] Filters work with real data
- [ ] Pagination works with 100+ logs
- [ ] Multiple sessions don't interfere
- [ ] Student deletion cascades to logs

---

## Future Enhancements

### Phase 2 (Post-MVP)

1. **Real-Time Updates**
   - WebSocket integration
   - Live activity feed
   - Auto-refresh options

2. **Manual Entry UI**
   - Quick-add participation
   - Batch entry mode
   - Keyboard shortcuts

3. **Export Features**
   - CSV export
   - PDF reports
   - Customizable formats

4. **Visualizations**
   - Time-series charts
   - Heatmaps
   - Participation trends

### Phase 3 (Advanced)

1. **Engagement Scoring**
   - Weighted interaction types
   - Quality metrics
   - Engagement levels

2. **Advanced Analytics**
   - Pattern detection
   - Correlation analysis
   - Predictive insights
   - Quiet student identification

3. **Alerts & Notifications**
   - Low participation alerts
   - Anomaly detection
   - Email notifications

4. **Comparative Analysis**
   - Session comparisons
   - Student comparisons
   - Class benchmarks

---

## Dependencies

### Backend
- `pg` (PostgreSQL driver)
- `express` (API framework)
- `socket.io` (real-time events - prepared but not used in MVP)

### Frontend
- `react` (UI framework)
- `@tanstack/react-query` (data fetching)
- `@heroicons/react` (icons)
- `tailwindcss` (styling)

---

## File Structure

```
backend/
  src/
    models/
      ParticipationLog.js          # Database model
    controllers/
      participationController.js   # API endpoints
    routes/
      participation.js             # Route definitions
    __tests__/
      models/
        ParticipationLog.test.js
      controllers/
        participationController.test.js

frontend/
  src/
    components/
      Participation/
        InteractionTypeBadge.jsx   # Type badge component
        ParticipationSummary.jsx   # Stats dashboard
        ParticipationFilters.jsx   # Filter bar
        ParticipationLogsList.jsx  # Logs table
        index.js                   # Component exports
    pages/
      SessionDetailPage.jsx        # Integration point
    services/
      api.js                       # API client

database/
  schema.sql                       # participation_logs table
```

---

## Summary

The Participation Tracking feature provides a **complete, read-only monitoring system** for student engagement during online sessions. It focuses on **clean data display**, **simple filtering**, and **manual refresh** to keep the MVP lean and performant.

The architecture is designed to scale - real-time updates, advanced analytics, and manual entry can be added in future phases without major refactoring.

**Key Achievement:** Instructors can now see detailed participation data captured by the extension, analyze engagement patterns, and identify students who may need additional support - all through a simple, intuitive interface.
