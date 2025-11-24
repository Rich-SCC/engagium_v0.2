# Class Management Feature Documentation

## Overview
Complete class management system allowing instructors to create, organize, and manage their classes with scheduling, session links, student rosters, and exemption lists.

## Current Implementation Status
✅ **Fully Implemented** - All core MVP features are complete and ready for testing.

## Features

### 1. Core Class Management
**Status:** ✅ Implemented

- Create new classes with detailed information
- Edit existing class details
- Archive/unarchive classes (soft delete)
- Delete classes (hard delete with validation)
- View all classes (with archive filter)
- Class status tracking (active/archived)

**Fields:**
- Name (required)
- Subject
- Section
- Description
- Schedule (JSONB: days of week + time)
- Status (active/archived)

### 2. Schedule Management
**Status:** ✅ Implemented

- Define class schedule with days of week
- Set class time/duration
- Display schedule on class cards
- Update schedule independently

**Storage Format:**
```json
{
  "days": ["Monday", "Wednesday", "Friday"],
  "time": "10:00 AM - 11:30 AM"
}
```

### 3. Session Links Management
**Status:** ✅ Implemented

- Store multiple meeting links per class
- Support for different platforms (Zoom, Google Meet, Teams, Other)
- Zoom-specific fields:
  - Meeting ID
  - Passcode
- Set primary link (one per class)
- Label links for easy identification
- Full CRUD operations

**Use Cases:**
- Main lecture link
- Breakout room links
- Alternative meeting platforms
- Lab session links

### 4. Student Management
**Status:** ✅ Implemented

#### Manual Operations
- Add students individually
- Edit student information
- Delete individual students
- View student roster
- Bulk delete multiple students

#### CSV Import/Export
- Import students from CSV file
- CSV format validation
- Import preview with error handling
- Detailed import results (success/failed)
- Export student roster to CSV

**CSV Format:**
```csv
first_name,last_name,email,student_id
John,Doe,john@email.com,12345
Jane,Smith,jane@email.com,12346
```

**Required Fields:** first_name, last_name  
**Optional Fields:** email, student_id

### 5. Exempted Accounts
**Status:** ✅ Implemented

- Maintain exemption list per class
- Exclude specific accounts from participation tracking
- Store reason for exemption
- Case-insensitive matching

**Use Cases:**
- Teaching Assistants
- Co-instructors
- Observers
- Student secondary/alt accounts
- Third-party participants

### 6. Class Details View
**Status:** ✅ Implemented

- Comprehensive class information display
- Full student roster with actions
- Quick access to links and exemptions
- Student selection and bulk operations
- CSV import/export from details page

## Database Schema

### Classes Table (Enhanced)
```sql
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    section VARCHAR(50),
    description TEXT,
    schedule JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Session Links Table (New)
```sql
CREATE TABLE session_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    link_url VARCHAR(500) NOT NULL,
    link_type VARCHAR(50),
    label VARCHAR(100),
    zoom_meeting_id VARCHAR(100),
    zoom_passcode VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Exempted Accounts Table (New)
```sql
CREATE TABLE exempted_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    account_identifier VARCHAR(255) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, account_identifier)
);
```

## API Endpoints

### Class Operations
```
GET    /api/classes                          - Get all classes (with archive filter)
GET    /api/classes/stats                    - Get class statistics
GET    /api/classes/:id                      - Get single class
POST   /api/classes                          - Create new class
PUT    /api/classes/:id                      - Update class
DELETE /api/classes/:id                      - Delete class
PATCH  /api/classes/:id/status               - Update class status (archive/activate)
PATCH  /api/classes/:id/schedule             - Update class schedule
```

### Session Links
```
GET    /api/classes/:id/links                - Get all links for class
POST   /api/classes/:id/links                - Add new link
PUT    /api/classes/:id/links/:linkId        - Update link
DELETE /api/classes/:id/links/:linkId        - Delete link
```

### Exempted Accounts
```
GET    /api/classes/:id/exemptions           - Get exempted accounts
POST   /api/classes/:id/exemptions           - Add exemption
DELETE /api/classes/:id/exemptions/:exemptionId - Remove exemption
```

### Student Management
```
GET    /api/classes/:classId/students        - Get all students
POST   /api/classes/:classId/students        - Add student
PUT    /api/classes/:classId/students/:studentId - Update student
DELETE /api/classes/:classId/students/:studentId - Delete student
POST   /api/classes/:classId/students/import - Import from CSV
POST   /api/classes/:classId/students/bulk-delete - Bulk delete
GET    /api/classes/:classId/students/export - Export to CSV
```

## Frontend Components

### Modals
1. **ClassFormModal** - Create/edit classes with schedule picker
2. **SessionLinksModal** - Manage multiple session links
3. **ExemptionListModal** - Manage exempted accounts
4. **StudentImportModal** - CSV import with preview and results

### Pages
1. **MyClasses** - Class overview with grid layout and actions menu
2. **ClassDetailsPage** - Detailed class view with full student management

## File Structure

### Backend
```
backend/src/
├── models/
│   ├── Class.js              (Enhanced)
│   ├── SessionLink.js        (New)
│   ├── ExemptedAccount.js    (New)
│   └── Student.js            (Enhanced)
├── controllers/
│   ├── classController.js    (Enhanced)
│   └── studentController.js  (Enhanced)
└── routes/
    └── classes.js            (Enhanced)

database/
├── schema.sql                        (Updated)
└── migration_class_management.sql    (Migration script)
```

### Frontend
```
frontend/src/
├── components/
│   ├── ClassFormModal.jsx        (New)
│   ├── SessionLinksModal.jsx     (New)
│   ├── ExemptionListModal.jsx    (New)
│   └── StudentImportModal.jsx    (New)
├── pages/
│   ├── MyClasses.jsx             (Enhanced)
│   └── ClassDetailsPage.jsx      (New)
└── services/
    └── api.js                    (Enhanced)
```

## Installation & Setup

### 1. Database Migration
For existing databases, run the migration script:
```bash
psql -U engagium_user -d engagium -f database/migration_class_management.sql
```

For new installations, the updated `schema.sql` includes all tables.

### 2. Backend Setup
No additional dependencies required. All features use existing packages.

### 3. Frontend Setup
No additional dependencies required. Uses existing React Query and Heroicons.

## Usage Guide

### Creating a Class
1. Navigate to "My Classes"
2. Click "Create Class" button
3. Fill in class information:
   - Name (required)
   - Subject, Section (optional)
   - Description
   - Schedule (days and time)
4. Click "Create Class"

### Managing Session Links
1. Open class details or use menu on class card
2. Click "Links" or "Session Links"
3. Add links with URL and type
4. For Zoom: add Meeting ID and Passcode
5. Set one link as primary (used for quick access)

### Importing Students
1. Prepare CSV file with headers: `first_name,last_name,email,student_id`
2. Open class details
3. Click "Import CSV"
4. Select file and preview
5. Review import results
6. Failed imports show specific errors

### Managing Exemptions
1. Open exemptions modal from class details
2. Add account identifier (email or name)
3. Optionally add reason (TA, Observer, etc.)
4. These accounts won't be tracked in sessions

### Archiving Classes
1. Use the menu on class card or edit page
2. Click "Archive"
3. Archived classes can be viewed with "Show Archived" toggle
4. Unarchive anytime to restore

## Testing
See `CLASS_MANAGEMENT_TESTING_CHECKLIST.md` for comprehensive testing guide.

## Security Considerations

### Authentication & Authorization
- All endpoints require `instructorAuth` middleware
- Users can only access their own classes
- Student data is scoped to class ownership

### Data Validation
- Required fields enforced on backend
- Email format validation
- Student ID uniqueness per class
- Exemption account uniqueness per class

### Deletion Protection
- Cannot delete class with existing sessions
- Cannot delete students with participation logs
- Bulk operations validate all IDs before deletion

## Performance Considerations

### Database Indexes
```sql
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_session_links_class_id ON session_links(class_id);
CREATE INDEX idx_exempted_accounts_class_id ON exempted_accounts(class_id);
```

### Query Optimization
- Student counts calculated in single query with JOIN
- Archived classes filtered at database level
- Primary link lookup optimized with boolean flag

## Known Limitations & Future Enhancements
See `CLASS_MANAGEMENT_PLANNED.md` for planned features and enhancements.
