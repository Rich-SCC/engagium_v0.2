# APPENDIX C  
SAMPLE SCREEN OUTPUTS

This appendix presents screenshots of the key user interface screens in the ENGAGIUM system.

> **Note:** Screenshots will be inserted upon completion of the system interface.

---

## C.1 Landing Page

**Purpose:** Public entry point that introduces the ENGAGIUM system and provides authentication access for instructors.

**Key Elements:**
- Hero section with ENGAGIUM branding and logo
- System description and value proposition
- Call-to-action buttons (Login / Sign Up)
- Navigation links to learning resources or documentation

[Screenshot: Landing Page - TBD]

---

## C.2 Login Page

**Purpose:** Allows instructors to authenticate with existing credentials and access the dashboard.

**Key Elements:**
- Email input field
- Password input field (masked)
- Forgot Password link
- Login button
- Sign Up link for new instructors
- Error message display area
- Form validation feedback

[Screenshot: Login Page - TBD]

---

## C.3 Sign Up Page

**Purpose:** Allows new instructors to create an account and register with ENGAGIUM.

**Key Elements:**
- Name input field
- Email input field
- Password input field (masked)
- Password confirmation field
- Terms of Service checkbox
- Sign Up button
- Login link for existing users
- Form validation and error messages

[Screenshot: Sign Up Page - TBD]

---

## C.4 Dashboard (Home)

**Purpose:** Provides an overview of the instructor's classes, upcoming sessions, and key statistics at a glance.

**Key Elements:**
- Main navigation sidebar with links to all major sections (Classes, Sessions, Analytics, Live Feed, Settings)
- Statistics dashboard showing total classes, total students, active sessions, and total sessions
- Upcoming sessions list with class name, date, time, and status indicators
- Quick action buttons for creating new classes or sessions
- Recent activity indicators

[Screenshot: Dashboard Home - TBD]

---

## C.5 My Classes

**Purpose:** Displays all classes created by the instructor, allowing class creation, editing, and session management.

**Key Elements:**
- Create New Class button
- Search and filter controls
- Class cards displaying:
  - Class name and section number
  - Student count
  - Total sessions conducted
  - Schedule information
  - View, Edit, and Delete action buttons
- Pagination or infinite scroll for multiple classes

[Screenshot: My Classes Page - TBD]

---

## C.6 Class Details / Student Roster

**Purpose:** Shows all enrolled students in a class with tools for roster management, bulk actions, and student data handling.

**Key Elements:**
- Class header with name, section, and schedule
- Tab navigation (Students, Sessions, Settings)
- Create/Import/Merge student action buttons
- Student table with columns:
  - Student name
  - Student ID or enrollment number
  - Tags/groups
  - Status (active, inactive, merged)
  - Individual action menu (view, edit, remove)
- Bulk action toolbar (select students, add tags, export, manage exemptions)
- Search and filter controls
- Pagination controls

[Screenshot: Class Details / Student Roster - TBD]

---

## C.7 Sessions (Calendar View)

**Purpose:** Displays all sessions for the instructor in a calendar format for easy browsing and session management.

**Key Elements:**
- Calendar view (month/week/day options)
- Create Session button
- Session indicators on calendar with class name and time
- Click to view session details
- Session status color coding (scheduled, active, completed)
- Navigate between months/periods

[Screenshot: Sessions Calendar View - TBD]

---

## C.8 Session Detail Page

**Purpose:** Displays comprehensive attendance and participation data for a specific completed session.

**Key Elements:**
- Session header with class name, date, start time, duration, and status
- Attendance summary (total present, late arrivals, absences)
- Tab navigation:
  - **Attendance Tab:** Student list with attendance status, join/leave times, and duration
  - **Participation Tab:** Participation events with type badges (chat, reactions, hand raises, mic toggles), student names, and timestamps
  - **Summary Tab:** Statistical overview of engagement metrics
- Filter controls (by student, by participation type, by time range)
- Search functionality
- Export CSV button
- Pagination controls

[Screenshot: Session Detail Page - TBD]

---

## C.9 Live Feed

**Purpose:** Displays real-time participation events and engagement data during active sessions.

**Key Elements:**
- Active sessions list with current participant count
- Live event stream showing:
  - Student names
  - Participation event types (Chat, Emoji Reactions, Hand Raises, Mic Toggle, Attendance)
  - Timestamps
  - Chronological ordering
- Participation statistics summary (event counts by type)
- Session status and current attendee count
- Refresh/auto-update indicator
- End Session button (if instructor viewing own session)

[Screenshot: Live Feed Page - TBD]

---

## C.10 Bundled Session Reports

**Purpose:** Generates and exports comprehensive reports combining attendance and participation data across multiple sessions with data export options.

**Key Elements:**
- Session selection (multi-select checkbox list)
- Class filter
- Date range picker
- Report preview section showing:
  - Summary statistics (total participants, total events, date range)
  - Consolidated attendance and participation tables
- Export format options:
  - CSV (comma-separated values)
  - PDF (formatted report)
- Export button
- Column customization options

[Screenshot: Bundled Session Reports - TBD]

---

## C.11 Participation Analytics Dashboard

**Purpose:** Displays aggregated participation metrics, engagement trends, and comparative analytics across sessions and students.

**Key Elements:**
- Date range and class selection filters
- Multi-tab interface:
  - **Summary Tab:** Key metrics cards (total events, average attendance rate, most active students, engagement trend)
  - **By Student Tab:** Student-level participation breakdown with ranking
  - **By Session Tab:** Session-level participation metrics and comparison
  - **Trends Tab:** Engagement trends over time with line/area charts
- Participation type breakdown chart (showing distribution of chat, reactions, hand raises, mics, attendance)
- Top participants ranking with event counts
- Low participation alerts or indicators
- Export analytics option

[Screenshot: Participation Analytics Dashboard - TBD]

---

## C.12 Settings Page

**Purpose:** Allows instructors to manage account preferences, authentication credentials, and system integrations.

**Key Elements:**
- Tab navigation:
  - **Profile Tab:** Name, email, profile information editing
  - **Security Tab:** Current password, change password form with confirmation
  - **Extensions Tab:** Zoom extension access token display and regeneration
- Save/Update buttons per section
- Success/error notification messages
- Help text and documentation links

[Screenshot: Settings Page - TBD]

---

## C.13 Zoom OAuth Callback Page

**Purpose:** Handles authentication callback after Zoom OAuth login flow.

**Key Elements:**
- Loading indicator during authentication processing
- Success message upon completion
- Automatic redirect to dashboard
- Error message if authentication fails with troubleshooting guidance

[Screenshot: Zoom OAuth Callback Page - TBD]

---

## C.14 Zoom Bridge Interface (Zoom Apps SDK)

**Purpose:** Embedded interface within Zoom meetings that allows monitoring and interaction with live session participation data.

**Key Elements:**
- Session identification and connection status
- Live participant count
- Real-time participation event feed
- Participation statistics summary
- Event type badges/indicators
- Minimal, meeting-optimized layout for sidebar/overlay display
- Refresh controls

[Screenshot: Zoom Bridge Interface - TBD]
