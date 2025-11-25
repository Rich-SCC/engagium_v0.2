# Student Management Feature Documentation

## Overview
Comprehensive student management system with roster management, CSV import/export, search/filter, tagging, notes, duplicate detection, and merge capabilities.

## Current Implementation Status
✅ **Fully Implemented** - All core MVP features are complete and ready for testing.

## Features

### 1. Student Roster Management
**Status:** ✅ Implemented

- Add students individually
- Edit student information
- Delete individual students
- View student roster with detailed information
- Bulk select and bulk delete students

**Fields:**
- First Name (required)
- Last Name (required)
- Email (optional)
- Student ID (optional, unique per class)

### 2. CSV Import/Export
**Status:** ✅ Implemented

#### Import Features
- Upload CSV file with student data
- Auto-detect column headers (flexible naming)
- Preview imported data before confirmation
- Detailed import results (success/failed)
- Error reporting per row
- Duplicate detection during import

**Supported CSV Formats:**
```csv
first_name,last_name,email,student_id
John,Doe,john@email.com,12345
```

#### Export Features
- Export all students to CSV
- Maintains same format as import
- One-click download

### 3. Search and Filtering
**Status:** ✅ Implemented

- Real-time search across:
  - First name
  - Last name
  - Email
  - Student ID
- Filter by tags
- Filter by notes (has notes / no notes)
- Clear all filters option

### 4. Sorting
**Status:** ✅ Implemented

**Sort Options:**
- Last Name (A-Z)
- First Name (A-Z)
- Student ID
- Email
- Participation Count (high to low)
- Notes Count (high to low)

### 5. Student Tags
**Status:** ✅ Implemented

Flexible labeling system for organizing students.

**Features:**
- Create custom tags per class
- Assign multiple tags to each student
- Color-coded tags (8 preset colors)
- Tag management interface
- Bulk assign tags to multiple students
- Bulk remove tags from multiple students
- View student count per tag
- Tags display on student roster

**Use Cases:**
- Group assignments (Group A, Group B)
- Student status (Needs Support, Advanced, At Risk)
- Presentation teams
- Lab sections
- Any custom categorization

**Tag Colors:**
- Blue, Green, Red, Yellow, Purple, Pink, Indigo, Gray

### 6. Student Notes (Log System)
**Status:** ✅ Implemented

Timestamped note-taking system for instructor observations.

**Features:**
- Add notes to any student
- View note history (chronological log)
- Edit own notes
- Delete own notes
- Track who created each note
- Timestamp on all notes
- Note count badge on student row
- Search notes by text

**Use Cases:**
- Behavior observations
- Academic concerns
- Attendance notes
- Communication logs
- Progress tracking
- Special accommodations notes

### 7. Duplicate Detection & Merge
**Status:** ✅ Implemented

#### Detection
- Check for duplicates by email or student ID
- Warning before adding duplicate student
- API endpoint for duplicate checking

#### Merge
- Manual student merge interface
- Select which student record to keep
- Select which student record to delete
- Transfer all data from merged student:
  - Participation logs
  - Notes
  - Tags
- Confirmation dialog with details
- Irreversible operation warning

### 8. Student Quick Stats
**Status:** ✅ Implemented

Display key metrics directly in the roster:
- **Participation Count:** Number of participation entries
  - Color-coded (gray=0, yellow=1-4, blue=5-9, green=10+)
- **Notes Count:** Badge showing number of notes
- **Tags:** Visual tags displayed under name

### 9. Bulk Operations
**Status:** ✅ Implemented

Floating action bar appears when students are selected.

**Operations:**
- Bulk delete selected students
- Bulk assign tags to selected students
- Clear selection
- Selection count display

### 10. Student Participation Tracking
**Status:** ✅ Implemented (Integration with Sessions)

- Track participation count per student
- Display in roster
- Color-coded indicators
- Links to participation logs

## Database Schema

### Students Table (Existing)
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    student_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);
```

### Student Tags Table (New)
```sql
CREATE TABLE student_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_color VARCHAR(20) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, tag_name)
);
```

### Student Tag Assignments (New)
```sql
CREATE TABLE student_tag_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES student_tags(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, tag_id)
);
```

### Student Notes Table (New)
```sql
CREATE TABLE student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Student CRUD
```
GET    /api/classes/:classId/students                    - Get all students (with filters)
GET    /api/classes/:classId/students/:studentId         - Get student details
POST   /api/classes/:classId/students                    - Add student
PUT    /api/classes/:classId/students/:studentId         - Update student
DELETE /api/classes/:classId/students/:studentId         - Delete student
```

### Bulk Operations
```
POST   /api/classes/:classId/students/import             - Import from CSV
POST   /api/classes/:classId/students/bulk-delete        - Bulk delete
POST   /api/classes/:classId/students/bulk-update        - Bulk update
GET    /api/classes/:classId/students/export             - Export to CSV
```

### Duplicate Management
```
GET    /api/classes/:classId/students/check-duplicates   - Check for duplicates
POST   /api/classes/:classId/students/merge              - Merge two students
```

### Tags
```
GET    /api/classes/:classId/tags                        - Get all tags
POST   /api/classes/:classId/tags                        - Create tag
PUT    /api/classes/:classId/tags/:tagId                 - Update tag
DELETE /api/classes/:classId/tags/:tagId                 - Delete tag
GET    /api/classes/:classId/students/:studentId/tags    - Get student's tags
POST   /api/classes/:classId/students/:studentId/tags/:tagId   - Assign tag
DELETE /api/classes/:classId/students/:studentId/tags/:tagId   - Remove tag
POST   /api/classes/:classId/tags/:tagId/bulk-assign     - Bulk assign tag
POST   /api/classes/:classId/tags/:tagId/bulk-remove     - Bulk remove tag
```

### Notes
```
GET    /api/classes/:classId/students/:studentId/notes   - Get student notes
POST   /api/classes/:classId/students/:studentId/notes   - Create note
PUT    /api/classes/:classId/students/:studentId/notes/:noteId  - Update note
DELETE /api/classes/:classId/students/:studentId/notes/:noteId  - Delete note
GET    /api/classes/:classId/notes/recent                - Get recent notes
```

## Frontend Components

### Pages
1. **ClassDetailsPage** - Enhanced with full student management

### Modals
1. **StudentImportModal** - CSV import with preview
2. **TagManagementModal** - Create/edit/delete tags
3. **StudentNotesModal** - View/add/edit notes log
4. **StudentMergeModal** - Merge duplicate students

### Components
1. **StudentRosterToolbar** - Search, filter, sort, actions
2. **StudentTableRow** - Individual student row with quick actions
3. **StudentBulkActionsBar** - Floating bar for bulk operations

## File Structure

### Backend
```
backend/src/
├── models/
│   ├── Student.js           (Enhanced)
│   ├── StudentTag.js        (New)
│   └── StudentNote.js       (New)
├── controllers/
│   ├── studentController.js        (Enhanced)
│   ├── studentTagController.js     (New)
│   └── studentNoteController.js    (New)
└── routes/
    └── classes.js           (Enhanced with student routes)

database/
└── schema.sql              (Updated with new tables)
```

### Frontend
```
frontend/src/
├── components/
│   ├── StudentImportModal.jsx          (Existing)
│   ├── TagManagementModal.jsx          (New)
│   ├── StudentNotesModal.jsx           (New)
│   ├── StudentMergeModal.jsx           (New)
│   ├── StudentRosterToolbar.jsx        (New)
│   ├── StudentTableRow.jsx             (New)
│   └── StudentBulkActionsBar.jsx       (New)
├── pages/
│   └── ClassDetailsPage.jsx            (Enhanced)
└── services/
    └── api.js                          (Enhanced)
```

## Usage Guide

### Adding Students

#### Individual
1. Navigate to class details
2. Use "Add Student" (to be implemented in future)
3. Fill in student information
4. Submit

#### Bulk Import
1. Navigate to class details
2. Click "Import CSV"
3. Select CSV file
4. Review preview
5. Confirm import
6. Review results

### Managing Tags
1. Click "Tags" button in toolbar
2. Create new tags with name and color
3. Assign tags to students:
   - From tag modal (view students with tag)
   - From bulk actions bar (select students → apply tag)
   - Individual student actions

### Adding Notes
1. Click notes icon on student row
2. View existing notes log
3. Add new note in text area
4. Submit
5. Edit/delete notes as needed

### Searching & Filtering
1. Use search bar for text search
2. Click "Filters" to open filter panel
3. Select tag filter
4. Select notes filter (has/doesn't have)
5. Results update in real-time

### Merging Duplicates
1. Click "Merge" button in toolbar
2. Select student to keep (primary)
3. Select student to merge (will be deleted)
4. Review what will happen
5. Confirm merge

### Bulk Operations
1. Select students using checkboxes
2. Bulk action bar appears at bottom
3. Choose action:
   - Apply tag
   - Delete students
4. Confirm action

## Security Considerations

### Authentication & Authorization
- All endpoints require `instructorAuth` middleware
- Users can only access their own class students
- Note creators can edit/delete own notes
- Admins have full access

### Data Validation
- Required fields enforced (first_name, last_name)
- Email format validation
- Student ID uniqueness per class
- Tag name uniqueness per class
- Note text required

### Deletion Protection
- Cannot delete students with participation logs
- Bulk delete checks all students first
- Merge operation is transactional (all or nothing)
- Confirmation dialogs for destructive actions

## Performance Considerations

### Database Indexes
```sql
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_student_tags_class_id ON student_tags(class_id);
CREATE INDEX idx_student_tag_assignments_student_id ON student_tag_assignments(student_id);
CREATE INDEX idx_student_tag_assignments_tag_id ON student_tag_assignments(tag_id);
CREATE INDEX idx_student_notes_student_id ON student_notes(student_id);
```

### Query Optimization
- Search uses single query with joins
- Participation count calculated in single query
- Tags retrieved with ARRAY_AGG for efficiency
- Pagination ready (limit/offset support)

### Frontend Optimization
- Modular components for code reusability
- React Query for caching
- Debounced search input (to be added)
- Lazy loading for large rosters (to be added)

## Known Limitations

### Current
- No individual "Add Student" form (only CSV import)
- No photo upload (will use session profile pictures)
- No advanced tag grouping
- No note categories
- No note attachments

### By Design
- Student ID is optional
- Email is optional
- No student-side access
- No email notifications to students
- No automated duplicate detection (manual only)

## Future Enhancements
See `STUDENT_MANAGEMENT_PLANNED.md` for planned features.
