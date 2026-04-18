# Frontend Codebase Exploration Summary

**Date:** April 18, 2026  
**Workspace:** `/home/rcorp/engagium_v0.2/frontend`  
**Framework:** React + Vite + Tailwind CSS  
**Status:** Complete codebase mapping

---

## 1. PAGE COMPONENTS (frontend/src/pages/) - User-Facing Screens

### 1.1 Authentication & Onboarding

#### **LandingPage.jsx**
- **Purpose:** Public homepage and authentication entry point
- **Route:** `/`
- **Key Elements:**
  - Hero section with app branding (Engagium logo)
  - Feature descriptions of the participation tracking system
  - Feature showcase section highlighting system benefits
  - Authentication modals accessible via buttons:
    - "Log In" modal
    - "Sign Up" modal
    - "Forgot Password" modal
  - Target Audience: Students and professors from St. Clare College of Caloocan
  - **Key Info Displayed:**
    - System tagline: "Class Participation Tracker for Online Learning"
    - System purpose: Fair and consistent tracking of student engagement
    - Features: Speaking turns, chat messages, reaction activity tracking

#### **ForgotPassword.jsx**
- **Purpose:** Self-service password recovery
- **Route:** `/forgot-password`
- **Key Elements:**
  - Email input field with validation
  - Error/success messaging
  - Submit button to send reset instructions
  - Link back to login

#### **ResetPassword.jsx**
- **Purpose:** Password reset with token validation
- **Route:** `/reset-password?token=<token>`
- **Key Elements:**
  - New password field with requirements validation (min 6 chars)
  - Confirm password field
  - Token validation from URL params
  - Success message with redirect to login
  - Error handling for invalid/expired tokens

#### **ZoomOAuthCallback.jsx**
- **Purpose:** Zoom OAuth token exchange intermediary
- **Route:** `/zoom/oauth/callback`
- **Key Elements:**
  - Handles Zoom OAuth code response
  - Error display for failed OAuth attempts
  - Redirects to `/zoom/bridge` with callback parameters
  - No user interaction required (auto-redirect)

---

### 1.2 Main Dashboard & Navigation

#### **Home.jsx**
- **Purpose:** Personalized dashboard/landing page for authenticated users
- **Route:** `/app/home`
- **Key Elements:**
  - Dashboard summary with quick stats
  - Class schedule overview with day-of-week parsing
  - Time parsing utilities for scheduled class times
  - Early arrival/late finish buffer calculations
  - Session status indicators (on-time, early, late)
  - Trending performance indicators
  - Quick action buttons
  - **Key Info Displayed:**
    - Today's schedule with session times and statuses
    - Class list with participation indicators
    - Session attendance metrics
    - Upcoming class sessions

#### **LiveFeed.jsx**
- **Purpose:** Real-time monitoring of active participation events
- **Route:** `/app/live-feed`
- **Key Elements:**
  - Active Session Card component (shows current session status)
  - Live Event Feed component (real-time participation updates)
  - WebSocket integration for live updates
  - Event types displayed:
    - Chat messages
    - Reactions (emoji/reactions from participants)
    - Hand raises
    - Microphone toggles (mute/unmute)
    - Participant join/leave events
  - Participant counts and session duration tracking
  - **Key Info Displayed:**
    - Current active sessions with duration
    - Participant count in each session
    - Real-time participation events (chat, reactions, etc.)
    - Event timestamps and participant names

---

### 1.3 Class Management

#### **MyClasses.jsx**
- **Purpose:** View, create, and manage classes
- **Route:** `/app/classes`
- **Key Elements:**
  - Create new class button with modal form
  - Class cards grid layout
  - Archive/active class toggle
  - Each class card shows:
    - Class name (formatted display)
    - Section/Subject tags
    - Edit/delete/archive menu options
    - Class metadata (subject, section, course code)
  - Class action menu:
    - Edit class details
    - Manage session links
    - Manage exemption list
    - Archive/restore class
    - Delete class
  - **Key Info Displayed:**
    - All active or archived classes
    - Class counts
    - Class hierarchy (course, section, subject)
    - Manage links modal
    - Exemption list management modal

#### **ClassDetailsPage.jsx**
- **Purpose:** Detailed class management and student roster
- **Route:** `/app/classes/:id`
- **Key Elements:**
  - Class header with edit/link management buttons
  - Student roster table with:
    - Student name, ID, email
    - Attendance/participation status
    - Tags (bulk assignable)
    - Individual student actions
  - Search and sort functionality (name, ID, etc.)
  - Toolbar with actions:
    - Import students (CSV)
    - Manage tags
    - Merge duplicate students
    - Export roster (CSV)
    - Bulk actions (delete, tag, etc.)
  - Student context modals:
    - Edit student info
    - View student notes
    - Merge with duplicate
    - Add/remove from class
  - **Key Info Displayed:**
    - Complete student roster with columns
    - Tags assigned to each student
    - Student notes/metadata
    - Class meeting links
    - Exemption list (students exempt from participation tracking)

---

### 1.4 Session Management

#### **Sessions.jsx**
- **Purpose:** Browse and manage all sessions for classes
- **Route:** `/app/sessions`
- **Key Elements:**
  - Session list/calendar view
  - Filter by class
  - Session creation form (modal)
  - Scheduled sessions display showing:
    - Session date/time
    - Class association
    - Status (scheduled, in-progress, ended)
    - Drift visualization (time variance from schedule)
  - Session calendar view component
  - Time parsing for scheduled times
  - Sort and expand functionality
  - **Key Info Displayed:**
    - All sessions grouped by class or chronologically
    - Scheduled times vs. actual times
    - Session status indicators
    - Drift from scheduled time
    - Quick access to session details

#### **SessionDetailPage.jsx**
- **Purpose:** View detailed session data with attendance and participation logs
- **Route:** `/app/sessions/:id`
- **Tabs:**
  1. **Attendance Tab**
     - Attendance roster showing:
       - Participant names
       - Join/leave times
       - Duration in session
       - Attendance status (present, late, absent)
       - Time intervals of attendance periods
     - Add unlinked participants to class roster
     - Participant join/leave logs

  2. **Participation Tab**
     - Participation summary stats:
       - Total interactions count
       - Unique participants count
       - Participation rate %
       - Most active student
     - Interaction type breakdown:
       - Chat messages count
       - Reactions count
       - Mic toggles count
       - Hand raises count
     - Detailed participation logs (sorted, paginated):
       - Participant name
       - Interaction type (with badge)
       - Timestamp
       - Additional metadata (message content, reaction emoji, etc.)
       - Speaking duration (for paired mic on/off events)

  3. **Details Tab**
     - Session information:
       - Title (auto-generated or custom)
       - Meeting link
       - Scheduled vs. actual times
       - Class association
       - Status

  - **Key Actions:**
    - Edit session details (title, times)
    - Add unlinked participants to roster
    - Filter participation logs by type
    - Search participants
  - **Key Info Displayed:**
    - Complete attendance record
    - All participation events in chronological order
    - Real-time and historical data
    - Engagement metrics

#### **BundledSessionDetailPage.jsx**
- **Purpose:** Combined view of multiple sessions (attendance & participation)
- **Route:** `/app/sessions/bundled/:bundleId?ids=id1,id2,...`
- **Key Elements:**
  - Multi-session attendance roster (combined)
  - Multi-session participation summary
  - Export functionality:
    - Attendance report (CSV/PDF)
    - Participation report (CSV/PDF)
    - Report scope selector (attendance vs. participation)
    - Report format selector (CSV vs. PDF)
  - Session filtering and search
  - Attendance aggregation across sessions
  - Participation aggregation across sessions
  - **Key Info Displayed:**
    - Combined attendance across all selected sessions
    - Combined participation summary
    - Per-session breakdown option
    - Export-ready data in multiple formats

---

### 1.5 Analytics & Reporting

#### **Analytics.jsx**
- **Purpose:** Class-level attendance analytics dashboard
- **Route:** `/app/analytics`
- **Key Elements:**
  - Class selector (card-based grid)
  - Drill-down to class-specific analytics
  - Tab views (when class selected):
    1. **Summary Tab** - Overview attendance metrics
    2. **Per-Student Tab** - Individual student attendance trends
    3. **Per-Session Tab** - Session-by-session breakdown
    4. **Trends Tab** - Historical engagement trends
  - Date range picker:
    - Quick filters: Last 7 days, Last 30 days, This semester, All time
    - Custom date range selection
  - Charts and visualizations:
    - Attendance rate trends (line chart)
    - Per-student attendance (bar chart)
    - Participation timeline (composed chart)
    - Color-coded interaction types (chat, reaction, hand raise, mic toggle)
  - **Key Info Displayed:**
    - Attendance rate per session
    - Per-student attendance trends
    - Participation type breakdowns
    - Historical engagement metrics

---

### 1.6 Zoom Integration

#### **ZoomIframeBridge.jsx**
- **Purpose:** Zoom Apps SDK integration within Zoom meeting interface
- **Route:** `/zoom/bridge`
- **Key Elements:**
  - Zoom SDK initialization
  - Token-based authentication (no JWT UI shell)
  - Heartbeat/connection status monitoring
  - Zoom meeting context reading
  - Embedded within Zoom meeting iframe
  - Real-time participation data transmission to Zoom
  - Status indicators:
    - Connection status
    - Token validity
    - Sync status
  - **Key Info Displayed:**
    - Zoom meeting metadata
    - Current session data
    - Extension status

---

### 1.7 User Settings

#### **Settings.jsx**
- **Purpose:** User account and extension token management
- **Route:** `/app/settings`
- **Key Elements:**
  - **Profile Management:**
    - First name, last name, email fields
    - Save changes button
    - Success/error messaging

  - **Password Management:**
    - Current password field (with reveal toggle)
    - New password field (with reveal toggle)
    - Confirm password field (with reveal toggle)
    - Password strength requirements display
    - Validation (min 6 chars, confirmation match)

  - **Extension Token Management:**
    - Generate new extension token button
    - Token display (masked by default, reveal option)
    - Copy token to clipboard
    - Active tokens list with:
      - Token preview (first/last chars)
      - Creation date
      - Expiration date (if applicable)
      - Revoke button
    - Token vault (local storage) for storing generated tokens
    - Persistent token storage with metadata

  - **Key Info Displayed:**
    - User profile information
    - Active extension tokens
    - Token creation/expiration dates
    - Token security indicators

---

## 2. SHARED COMPONENTS (frontend/src/components/) - Reusable UI Building Blocks

### 2.1 Layout & Structure

#### **Layout.jsx**
- Responsive sidebar navigation with collapse/expand
- Left sidebar with:
  - Logo/brand
  - User profile section (avatar, name, email)
  - Navigation menu (Home, Live Feed, Classes, Sessions, Analytics, Settings)
  - Logout button
- Responsive on mobile/tablet/desktop
- Persistent sidebar state (localStorage)
- User initials in avatar
- Dynamic nav links with active state

### 2.2 Analytics Components

#### **ClassAnalytics.jsx**
- **Purpose:** Comprehensive class-level analytics dashboard
- **Features:**
  - Multiple tab views (Summary, Per-Student, Per-Session, Trends)
  - Recharts integration for data visualization
  - Four chart types:
    - Area charts (attendance trends)
    - Bar charts (per-student comparison)
    - Composed charts (multi-metric timelines)
    - Pie charts (interaction type distribution)
  - Date range picker with quick filters
  - Color-coded participation types:
    - Chat: #557170 (gray)
    - Reaction: #f59e0b (amber)
    - Hand Raise: #22c55e (green)
    - Mic Toggle: #3a5050 (dark gray)
    - Activity: #64748b (slate)
  - Aggregated session logs
  - Per-student engagement scoring

#### **StudentAnalytics.jsx**
- **Purpose:** Individual student participation analytics
- **Features:**
  - Student-specific participation trends
  - Area and bar charts for individual metrics
  - Date range picker
  - Engagement score calculation
  - Interaction type breakdown
  - Session-by-session analysis
  - Performance indicators

#### **DateRangePicker.jsx**
- Compact and full variants
- Quick filter buttons (Last 7/30 days, This semester, All time)
- Date input fields
- Date range display label
- Reusable across analytics pages

### 2.3 Authentication Modals

#### **Auth/LoginModal.jsx**
- Email and password input fields
- Remember me checkbox
- Login button
- Error messaging
- Link to forgot password
- Link to sign up

#### **Auth/SignUpModal.jsx**
- First name, last name, email inputs
- Password and confirm password fields
- Organization/institution field
- Terms acceptance checkbox
- Sign up button
- Error handling and validation
- Link to login page

#### **Auth/ForgotPasswordModal.jsx**
- Email input field
- Submit button to send reset link
- Success/error messaging

### 2.4 Session Management Components

#### **Sessions/SessionFormModal.jsx**
- Create/edit session form
- Session title input
- Meeting link input
- Date and time pickers
- Class selector
- Submit button
- Validation and error handling

#### **Sessions/AttendanceRoster.jsx**
- Attendance records list/table
- Columns: Participant name, join time, leave time, duration, status
- Expandable attendance intervals
- Add unlinked participants to roster button
- Empty state messaging
- Loading state
- Status badges (present, late, absent)

#### **Sessions/SessionCalendarView.jsx**
- Calendar view of scheduled sessions
- Visual time block representation
- Color-coded by class
- Clickable session navigation

### 2.5 Participation Components

#### **Participation/ParticipationSummary.jsx**
- Stats cards showing:
  - Total interactions count
  - Unique participants count
  - Participation rate %
  - Most active student name
- Interaction type breakdown with:
  - Icons (ChatBubbleLeft, FaceSmile, Microphone, HandRaised)
  - Colored badges
  - Count bars
- "Loading participation summary" state

#### **Participation/ParticipationLogsList.jsx**
- Sortable and paginated participation logs
- Columns: Timestamp, participant name, interaction type, value/details
- 50 items per page
- Expandable rows for additional metadata
- Mic toggle pairing logic (matches unmute/mute pairs with duration)
- Sorting by timestamp (default, descending)
- Filter by interaction type
- Empty state handling

#### **Participation/ParticipationFilters.jsx**
- Filter by interaction type:
  - Chat
  - Reaction
  - Hand raise
  - Mic toggle
- Search by participant name
- Interaction type badge selector

#### **Participation/InteractionTypeBadge.jsx**
- Visual badge for each interaction type
- Icon + label combination
- Color-coded styling
- Reusable across participation views

### 2.6 Class Management Components

#### **ClassDetails/ClassFormModal.jsx**
- Create/edit class form
- Fields:
  - Course code
  - Section
  - Subject
  - Description
  - Meeting links
  - Schedule configuration (days, times)
- Form validation
- Submit button
- Cancel button

#### **ClassDetails/SessionLinksModal.jsx**
- Manage multiple meeting links per class
- Add/remove session links
- Link type selector (Google Meet, Zoom, etc.)
- URL input and validation
- Save changes button

#### **ClassDetails/ExemptionListModal.jsx**
- Manage students exempt from participation tracking
- Add/remove students to exemption list
- Search student by name
- List of exempted students
- Save changes button

### 2.7 Student Management Components

#### **Students/StudentRosterToolbar.jsx**
- Search bar with real-time filtering
- Sort selector (by name, ID, email, etc.)
- Filter options
- Bulk action buttons

#### **Students/StudentTableRow.jsx**
- Individual student row in roster table
- Columns: Name, ID, Email, Tags, Status
- Context menu (three dots)
- Edit/delete/note options
- Tag display with management

#### **Students/StudentFormModal.jsx**
- Create/edit student form
- Fields: First name, last name, email, ID
- Validation
- Submit button

#### **Students/StudentImportModal.jsx**
- CSV file upload for bulk student import
- File preview/validation
- Mapping selector (column to field mapping)
- Import button
- Progress indicator
- Error reporting

#### **Students/StudentNotesModal.jsx**
- Add/edit notes for a student
- Rich text editor or plain text
- Save button
- Notes history/timeline (optional)

#### **Students/StudentMergeModal.jsx**
- Select duplicate student to merge
- Merge strategy selector
- Confirmation dialog
- Merge button
- Error handling

#### **Students/StudentBulkActionsBar.jsx**
- Bulk action buttons when students selected
- Actions: Delete selected, Assign tag, etc.
- Selection count display
- Clear selection button

#### **Students/TagManagementModal.jsx**
- Manage student tags/labels
- Create new tag
- Delete tag
- Edit tag name/color
- Bulk assign tag to selected students
- Tag list view

### 2.8 Support Components

#### **ActiveSessionCard.jsx**
- Displays currently active sessions
- Shows:
  - Session title
  - Start time/duration
  - Participant count (calculated from join/leave events)
  - Class association
  - WebSocket connection status
- Link to session detail page
- Real-time updates every second

#### **LiveEventFeed.jsx**
- Real-time WebSocket event stream
- Event types with icons:
  - ChatBubbleLeft icon for chat messages
  - FaceSmile icon for reactions (emoji)
  - HandRaised icon for hand raises
  - Microphone icon for mic toggles
  - Video Camera icon for video on/off
  - Join/leave icons for participant events
- Scrollable feed (auto-scroll option)
- Event timestamps
- Participant names
- Metadata display (message content, emoji, etc.)
- Clear events button
- Loading state

#### **ActiveSessionCard.jsx**
- Current session overview card
- Participant tracking
- Duration calculation and display
- Join/leave event analysis

---

## 3. DATA FLOW & KEY CONTEXTS

### Authentication Context
- User profile data (name, email)
- Login/logout/register functions
- JWT token management
- Authentication state (isAuthenticated, isInitializing)

### WebSocket Context
- Real-time participation events
- Active sessions list
- Recent events stream
- Connection status monitoring

### React Query (TanStack Query)
- API call caching and synchronization
- Query keys for:
  - Classes (all classes, class details, students, tags)
  - Sessions (all sessions, session details, attendance)
  - Participation (logs, summary, student analytics)
  - User profile

---

## 4. INTERACTION TYPES TRACKED

The system tracks the following participation interactions:
1. **chat** - Chat messages in the meeting
2. **reaction** - Emoji reactions (joy, laugh, wow, heart, clap, thumbs up/down, etc.)
3. **hand_raise** - Virtual hand raise
4. **mic_toggle** - Microphone mute/unmute (paired events showing speaking duration)
5. **attendance** - Join/leave events

---

## 5. KEY UI PATTERNS & DESIGN SYSTEM

### Typography & Colors
- Primary color: Accent-500 (teal/cyan)
- Secondary colors: Gray scale, blues, greens, yellows for interaction types
- Font: Sans-serif (Tailwind defaults)
- Icons: Heroicons 24px outline

### Layout Patterns
- Responsive grid layout (1 col mobile, 2 cols tablet, 3 cols desktop)
- Sidebar navigation with collapsible state
- Tab interfaces for multi-view data
- Modal dialogs for forms and actions
- Card-based layouts for class/session lists
- Table layouts for rosters with row actions

### Common UI Components
- Buttons (primary accent, secondary outline)
- Input fields with validation
- Select dropdowns
- Date pickers
- Checkboxes and toggles
- Status badges
- Loading spinners
- Error/success messages
- Empty states

---

## 6. RECOMMENDED CONTENT FOR APPENDIX C - "Screen Outputs"

Based on the frontend exploration, Appendix C should include:

### 6.1 User Authentication Flows
- Landing Page screenshot (hero section, auth buttons)
- Login Modal screenshot
- Sign Up Modal screenshot
- Forgot Password flow

### 6.2 Main Application Screens
- Home Dashboard (class schedule, quick stats)
- Live Feed screen (active sessions, real-time event log)
- My Classes list view (class cards grid)
- Class Details page (student roster)

### 6.3 Session Management
- Sessions list (calendar view)
- Session Detail - Attendance Tab (roster with times)
- Session Detail - Participation Tab (summary stats + logs)

### 6.4 Analytics & Reporting
- Analytics page (class selector)
- Class Analytics - Summary Tab (attendance metrics)
- Class Analytics - Per-Student Tab (individual trends)
- Class Analytics - Trends Tab (historical data chart)

### 6.5 Student Management
- Student roster with filters and bulk actions
- Student import modal
- Student tag management

### 6.6 Settings & Configuration
- User profile settings
- Password change form
- Extension token generation and management

### 6.7 Zoom Integration
- Zoom iframe bridge (as seen within Zoom meeting)
- Real-time participation tracking display

---

## 7. TECHNOLOGY STACK SUMMARY

- **Frontend Framework:** React 18+ with JSX
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Icons:** Heroicons (24px outline)
- **Data Fetching:** Axios + React Query (TanStack Query)
- **WebSocket:** Custom WebSocket context for real-time updates
- **Charting:** Recharts for analytics visualizations
- **Routing:** React Router v6
- **Form State Management:** Local component state (useState)
- **API Communication:** RESTful + WebSocket (Socket.io)
- **CSS Utilities:** Responsive design patterns, gradient backgrounds, shadows, borders

---

## 8. FILE STRUCTURE SUMMARY

```
frontend/src/
├── pages/                          # Route pages (14 files)
│   ├── LandingPage.jsx
│   ├── Home.jsx
│   ├── MyClasses.jsx
│   ├── ClassDetailsPage.jsx
│   ├── Sessions.jsx
│   ├── SessionDetailPage.jsx
│   ├── BundledSessionDetailPage.jsx
│   ├── Analytics.jsx
│   ├── LiveFeed.jsx
│   ├── Settings.jsx
│   ├── ForgotPassword.jsx
│   ├── ResetPassword.jsx
│   ├── ZoomIframeBridge.jsx
│   └── ZoomOAuthCallback.jsx
│
├── components/                     # Reusable components
│   ├── Layout.jsx                  # Main layout wrapper
│   ├── ActiveSessionCard.jsx       # Current session status
│   ├── ClassAnalytics.jsx          # Class-level analytics
│   ├── StudentAnalytics.jsx        # Student-level analytics
│   ├── DateRangePicker.jsx         # Date range filter
│   ├── LiveEventFeed.jsx           # Real-time event stream
│   │
│   ├── Auth/                       # Authentication modals
│   │   ├── LoginModal.jsx
│   │   ├── SignUpModal.jsx
│   │   └── ForgotPasswordModal.jsx
│   │
│   ├── ClassDetails/               # Class management modals
│   │   ├── ClassFormModal.jsx
│   │   ├── SessionLinksModal.jsx
│   │   └── ExemptionListModal.jsx
│   │
│   ├── Sessions/                   # Session management
│   │   ├── AttendanceRoster.jsx
│   │   ├── SessionCalendarView.jsx
│   │   └── SessionFormModal.jsx
│   │
│   ├── Participation/              # Participation tracking
│   │   ├── ParticipationSummary.jsx
│   │   ├── ParticipationLogsList.jsx
│   │   ├── ParticipationFilters.jsx
│   │   ├── InteractionTypeBadge.jsx
│   │   └── index.js
│   │
│   └── Students/                   # Student management
│       ├── StudentBulkActionsBar.jsx
│       ├── StudentFormModal.jsx
│       ├── StudentImportModal.jsx
│       ├── StudentMergeModal.jsx
│       ├── StudentNotesModal.jsx
│       ├── StudentRosterToolbar.jsx
│       ├── StudentTableRow.jsx
│       └── TagManagementModal.jsx
│
├── services/                       # API clients
│   ├── api.js                      # REST API client
│   ├── zoomIframeApi.js            # Zoom SDK API
│   └── zoomSdkBridge.js            # Zoom SDK bridge
│
├── contexts/                       # React contexts
│   ├── AuthContext.js
│   └── WebSocketContext.js
│
├── utils/                          # Utility functions
│   ├── analytics.js                # Analytics calculations
│   ├── classFormatter.js           # Class display formatting
│   ├── urlUtils.js                 # URL parsing and formatting
│   └── ...
│
├── styles/                         # Global styles
├── assets/                         # Images, logos
└── App.jsx                         # Root component with routing
```

---

## 9. CURRENT LIMITATIONS & NOTES

- **Analytics** currently shows only attendance metrics (participation analytics in progress)
- **Zoom Bridge** operates in token-based mode (separate from main UI)
- **Storage** uses localStorage for UI state (sidebar collapse, token vault)
- **Real-time** functionality depends on WebSocket connection status
- **Export** functionality supports CSV and PDF formats for bulk session reports
- **Participation** logs require paginated API calls for large datasets (500 items per page)

---

**END OF FRONTEND EXPLORATION SUMMARY**

Generated: April 18, 2026
