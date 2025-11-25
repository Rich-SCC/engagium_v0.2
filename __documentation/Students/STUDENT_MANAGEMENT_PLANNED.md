# Student Management - Planned Features

## Features Not Yet Implemented

### 1. Individual Student Add/Edit Form
**Status:** 🔄 Planned Enhancement

**Description:**
Modal form to add or edit individual student without CSV import.

**Features:**
- Add single student form
- Edit student inline or in modal
- Real-time duplicate checking
- Form validation
- Quick add from roster page

**Why Not in MVP:**
- CSV import covers bulk adding
- Can be added as convenience feature
- Not blocking core functionality

---

### 2. Student Profile Pictures
**Status:** ✅ Deferred to Session Integration

**Description:**
Display student profile pictures from video conferencing sessions.

**Implementation:**
- Capture profile picture during Zoom/Meet sessions
- Store image URL or base64
- Display in roster
- Fallback to initials

**Why Deferred:**
- Requires session integration
- Pictures captured during live sessions
- No manual upload needed
- Will be implemented with session features

---

### 3. Advanced Analytics Per Student
**Status:** 🔄 Planned Enhancement

**Description:**
Individual student analytics dashboard showing detailed participation patterns.

**Metrics:**
- Participation timeline
- Frequency chart
- Session attendance history
- Comparison to class average
- Interaction type breakdown
- Engagement score

**Why Not in MVP:**
- Current MVP shows simple participation count
- Advanced analytics require session data
- Will expand once participation tracking is mature

---

### 4. Student Attendance Tracking
**Status:** 🔄 Planned Enhancement

**Description:**
Automated attendance marking based on session presence.

**Features:**
- Auto-mark present if student participates
- Manual attendance override
- Absence tracking
- Attendance reports
- Excuse absence functionality
- Attendance percentage calculation

---

### 5. Student Groups (vs Tags)
**Status:** 🔄 Planned Enhancement

**Description:**
Formal grouping system where each student belongs to one group (mutually exclusive).

**Difference from Tags:**
- Tags: Flexible, multiple per student
- Groups: Structured, one group per student per context

**Use Cases:**
- Lab sections
- Discussion groups
- Project teams
- Class periods (for combined classes)

**Features:**
- Create groups
- Assign students to groups
- Group-based filtering
- Group participation statistics

---

### 6. Student Import from LMS
**Status:** ❌ Deferred (Requires External Integration)

**Description:**
Import student rosters directly from Learning Management Systems.

**Potential Integrations:**
- Canvas
- Blackboard
- Moodle
- Google Classroom

**Why Deferred:**
- Requires API keys and institutional permissions
- Complex OAuth flows
- Each LMS has different API
- CSV import is sufficient for MVP

---

### 7. Automated Duplicate Detection
**Status:** 🔄 Planned Enhancement

**Description:**
Automatically detect and suggest merges for duplicate students.

**Features:**
- Fuzzy name matching
- Email matching
- Student ID matching
- Suggested matches dashboard
- Bulk review and merge
- Confidence scores

**Why Not in MVP:**
- Manual merge is sufficient
- Requires sophisticated matching algorithm
- Risk of false positives
- Better to start manual, then automate

---

### 8. Student Communication History
**Status:** ❌ Deferred (No Student Communication)

**Description:**
Log of all communications with student.

**Why Deferred:**
- App is instructor-only
- No email integration in MVP
- Notes system serves similar purpose
- May reconsider if email features added

---

### 9. Student Performance Grading
**Status:** ❌ Out of Scope

**Description:**
Grade tracking and calculation.

**Why Out of Scope:**
- Engagium focuses on participation, not grades
- LMS systems handle grading
- Not a participation tracking feature
- Would require extensive additional features

---

### 10. Export with Filters
**Status:** 🔄 Planned Enhancement

**Description:**
Export CSV based on current filters and search.

**Features:**
- Export search results
- Export students with specific tag
- Export students with/without notes
- Custom column selection
- Multiple format options (CSV, Excel, PDF)

---

### 11. Student Archive/Soft Delete
**Status:** 🔄 Planned Enhancement

**Description:**
Archive students instead of deleting them.

**Features:**
- Archive student (soft delete)
- Archived students hidden from roster
- View archived students
- Restore archived student
- Preserve participation history

**Use Cases:**
- Student drops class mid-semester
- Student withdraws
- Need to preserve data but hide from active roster

---

### 12. Note Categories/Tags
**Status:** 🔄 Planned Enhancement

**Description:**
Categorize notes for better organization.

**Categories:**
- Academic
- Behavioral
- Administrative
- Communication
- Custom categories

**Features:**
- Filter notes by category
- Color-coded categories
- Category statistics

---

### 13. Note Templates
**Status:** 🔄 Planned Enhancement

**Description:**
Pre-defined note templates for common situations.

**Templates:**
- Absent from class
- Late submission
- Exceptional participation
- Needs support
- Parent contact
- Custom templates

---

### 14. Bulk Edit Students
**Status:** 🔄 Planned Enhancement

**Description:**
Edit multiple students at once.

**Fields:**
- Update email domain
- Add prefix to student IDs
- Mass tag removal
- Clear all tags

**Why Not in MVP:**
- Bulk tag assignment is implemented
- Other bulk edits less common
- Can be added as convenience feature

---

### 15. Student Search History
**Status:** 🔄 Planned Enhancement

**Description:**
Save recent searches and filters for quick access.

**Features:**
- Search history dropdown
- Saved filter combinations
- Named filters
- Quick apply saved filters

---

### 16. Student Participation Alerts
**Status:** 🔄 Planned Enhancement (Requires Session Data)

**Description:**
Automatic alerts for low participation.

**Alerts:**
- Student hasn't participated in X sessions
- Participation dropped significantly
- Below class average
- Configurable thresholds

**Notification Methods:**
- In-app dashboard
- Email to instructor
- (No student notification - instructor only)

---

### 17. Class Roster Comparison
**Status:** 🔄 Planned Enhancement

**Description:**
Compare rosters between multiple classes.

**Use Cases:**
- Find students enrolled in multiple sections
- Track students across semesters
- Identify repeat students

---

### 18. Student QR Codes
**Status:** 🔄 Planned Enhancement

**Description:**
Generate unique QR code per student for quick identification.

**Use Cases:**
- Physical attendance check-in
- Quick student lookup
- Printable class roster with QR codes

---

### 19. Note Attachments
**Status:** 🔄 Planned Enhancement

**Description:**
Attach files to student notes.

**File Types:**
- Documents (PDF, Word)
- Images
- Links

**Why Not in MVP:**
- Requires file storage solution
- Adds complexity
- Text notes sufficient for MVP

---

### 20. Advanced Tag Features
**Status:** 🔄 Planned Enhancement

**Features:**
- Tag hierarchies (parent/child tags)
- Tag templates per class type
- Tag visibility settings
- Tag expiration dates (auto-remove)
- Tag statistics and reports

---

## Implementation Priority

### High Priority (Next Phase)
1. Individual Student Add/Edit Form
2. Export with Filters
3. Student Archive/Soft Delete
4. Automated Duplicate Detection
5. Advanced Analytics Per Student

### Medium Priority
6. Student Groups
7. Student Attendance Tracking
8. Note Categories
9. Note Templates
10. Bulk Edit Students

### Low Priority
11. Student Search History
12. Note Attachments
13. Advanced Tag Features
14. Class Roster Comparison
15. Student QR Codes

### Deferred/Out of Scope
- Student Profile Pictures (deferred to sessions)
- LMS Integration (requires partnerships)
- Student Communication History (no student interaction)
- Performance Grading (out of scope)
- Participation Alerts (requires session data)

---

## Integration Dependencies

### Requires Session Implementation
- Student Profile Pictures
- Advanced Analytics
- Attendance Tracking
- Participation Alerts

### Requires External Services
- LMS Integration (Canvas, Blackboard, etc.)
- Email Service (for alerts)
- File Storage (for attachments)

### Requires Additional Infrastructure
- Background Jobs (for automated detection)
- Notification System (for alerts)
- File Upload Service (for attachments)
