# APPENDIX E  
USER MANUAL

> ⚠️ **DRAFT** — This appendix is subject to change as the UI/UX evolves. To be finalized before final submission when the interface is frozen.

This appendix provides a comprehensive guide for instructors on installing, configuring, and using the ENGAGIUM system.

---

## E.1 Installation Guide (Chrome Extension)

### E.1.1 Prerequisites

Before installing ENGAGIUM, ensure you have:

- **Google Chrome** version 120 or higher
- An active **ENGAGIUM account** (register at the web dashboard)
- A stable **internet connection**

### E.1.2 Installing from Chrome Web Store

> **Note:** If ENGAGIUM is not yet published to the Chrome Web Store, follow the "Installing as Unpacked Extension" instructions in Section E.1.3.

1. Open Google Chrome
2. Navigate to the Chrome Web Store
3. Search for "ENGAGIUM" or use the direct link provided by your institution
4. Click **Add to Chrome**
5. In the confirmation dialog, click **Add extension**
6. The ENGAGIUM icon will appear in your Chrome toolbar

### E.1.3 Installing as Unpacked Extension (Development/Testing)

If you received ENGAGIUM as a ZIP file or folder:

1. Extract the extension files to a folder on your computer
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** using the toggle in the top-right corner
4. Click **Load unpacked**
5. Select the folder containing the extension files (the folder with `manifest.json`)
6. The extension will appear in your extensions list

### E.1.4 Connecting to Your Account

After installation, you must connect the extension to your ENGAGIUM account:

1. Click the ENGAGIUM icon in your Chrome toolbar
2. Click **Connect Account** or **Open Settings**
3. You will be redirected to the ENGAGIUM dashboard
4. Log in to your account (or register if you don't have one)
5. Navigate to **Settings** → **Extension Tokens**
6. Click **Generate New Token**
7. Copy the generated token
8. Return to the extension's Options page
9. Paste the token and click **Connect**
10. You should see a confirmation message: "Connected as [Your Name]"

---

## E.2 System Requirements

### E.2.1 Client Requirements (Instructor's Computer)

| Requirement | Specification |
|-------------|---------------|
| **Operating System** | Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+) |
| **Browser** | Google Chrome version 120 or higher |
| **Internet** | Stable broadband connection (minimum 5 Mbps recommended) |
| **Memory** | 4 GB RAM minimum (8 GB recommended when running Google Meet) |
| **Display** | 1280 x 720 minimum resolution |

### E.2.2 Browser Extension Requirements

| Requirement | Specification |
|-------------|---------------|
| **Chrome Version** | 120+ (Manifest V3 support required) |
| **Permissions** | Access to meet.google.com |
| **Storage** | ~5 MB for extension and local data |

### E.2.3 Backend Requirements (For Institutional Deployment)

| Component | Specification |
|-----------|---------------|
| **Server** | Node.js 18+ |
| **Database** | PostgreSQL 14+ |
| **Memory** | 2 GB RAM minimum |
| **Storage** | 10 GB minimum (scales with usage) |

---

## E.3 Using the Instructor Dashboard

### E.3.1 Accessing the Dashboard

1. Open your web browser
2. Navigate to your institution's ENGAGIUM URL (e.g., `https://engagium.yourinstitution.edu`)
3. Enter your email and password
4. Click **Log In**

### E.3.2 Dashboard Overview

Upon login, you will see the **Home** page with:

- **Statistics Cards**: Total classes, students, active sessions, total sessions
- **Recent Sessions**: List of your most recent class sessions
- **Quick Actions**: Shortcuts to common tasks
- **Notifications**: System alerts and updates

### E.3.3 Navigation

The main navigation menu includes:

| Menu Item | Description |
|-----------|-------------|
| **Home** | Dashboard overview with statistics |
| **Classes** | Manage your classes and student rosters |
| **Sessions** | View session history and calendar |
| **Live Feed** | Real-time participation during active sessions |
| **Analytics** | Participation metrics and reports |
| **Settings** | Profile and extension token management |

### E.3.4 Managing Classes

**Creating a New Class:**

1. Navigate to **Classes**
2. Click **+ Create New Class**
3. Fill in the form:
   - **Class Name**: e.g., "Introduction to Computing"
   - **Subject Code**: e.g., "CCS101"
   - **Section**: e.g., "A1"
   - **Schedule**: Select days and time
   - **Description** (optional)
4. Click **Create Class**

**Adding Students:**

1. Open the class by clicking **View**
2. Go to the **Students** tab
3. Click **+ Add Student** for individual entry, or
4. Click **Import CSV** for bulk import
5. For CSV import, use the format:
   ```
   full_name,student_id
   "Dela Cruz, Juan",2021-0001
   "Santos, Maria",2021-0002
   ```

**Adding Meeting Links:**

1. In the class details, go to **Settings** tab
2. Under **Meeting Links**, click **+ Add Link**
3. Paste your Google Meet URL
4. Optionally mark as **Primary** link
5. Click **Save**

---

## E.4 Starting a Session

### E.4.1 From the Browser Extension

This is the recommended method for starting sessions:

1. **Open Google Meet** in Chrome and start or join your meeting
2. Wait for the meeting to fully load (you should see the participants panel available)
3. **Click the ENGAGIUM icon** in your Chrome toolbar
4. The extension will show:
   - Meeting detected: ✓
   - Meeting URL: `meet.google.com/xxx-xxxx-xxx`
   - Associated Class (if mapped): CCS101 - Introduction to Computing
5. **Click "Start Session"**
6. The extension will confirm: "Session started"
7. The status indicator will turn green: 🟢 Tracking

### E.4.2 During the Session

While the session is active:

- The extension automatically tracks:
  - ✓ Participants joining and leaving
  - ✓ Chat messages sent
  - ✓ Emoji reactions
  - ✓ Hand raises
  - ✓ Microphone unmutes

- You can view real-time updates on the **Live Feed** page in the dashboard
- Continue teaching normally—ENGAGIUM works silently in the background

### E.4.3 Ending the Session

When your class is finished:

1. **Click the ENGAGIUM icon** in Chrome
2. Click **"End Session"**
3. The extension will:
   - Close all open attendance intervals
   - Calculate total durations for each participant
   - Mark enrolled students who didn't attend as "Absent"
   - Finalize all records

Alternatively, you can end the session from the **Live Feed** page by clicking the **End Session** button.

---

## E.5 Viewing Logs

### E.5.1 Session Details

To view detailed attendance and participation for a session:

1. Navigate to **Sessions** in the dashboard
2. Find the session in the list or calendar
3. Click on the session to open **Session Details**
4. You will see tabs for:
   - **Attendance**: List of students with status, join times, and durations
   - **Participation**: Individual events (chat, reactions, hand raises, mic)
   - **Summary**: Overview statistics

### E.5.2 Attendance Records

The Attendance tab shows:

| Column | Description |
|--------|-------------|
| **Student Name** | Name from roster (or participant name if unmatched) |
| **Status** | Present (🟢), Late (🟡), or Absent (🔴) |
| **First Join** | Time when student first joined |
| **Last Leave** | Time when student last left |
| **Duration** | Total time in the meeting |

You can filter by status and search by name.

### E.5.3 Participation Logs

The Participation tab displays chronological events:

| Column | Description |
|--------|-------------|
| **Time** | Timestamp of the event |
| **Student** | Student who performed the action |
| **Type** | Chat, Reaction, Hand Raise, or Mic Unmute |
| **Details** | Additional info (e.g., emoji type) |

### E.5.4 Analytics Page

For aggregated data across multiple sessions:

1. Navigate to **Analytics**
2. Select a **date range** and **class** (or all classes)
3. View:
   - Total participation events
   - Average attendance rate
   - Top participants
   - Participation by type (chart)
   - Low participation alerts

---

## E.6 Troubleshooting Guide

### E.6.1 Extension Not Detecting Meeting

**Symptom:** The extension popup shows "No meeting detected" even though you're in a Google Meet.

**Solutions:**

1. **Refresh the Google Meet tab** and wait for it to fully load
2. Ensure you're on a valid Google Meet URL (`meet.google.com/xxx-xxxx-xxx`)
3. Check that the extension has permission to access meet.google.com:
   - Go to `chrome://extensions/`
   - Click **Details** on ENGAGIUM
   - Under **Site access**, ensure meet.google.com is allowed
4. Try disabling and re-enabling the extension

### E.6.2 Extension Not Connected

**Symptom:** The extension shows "Not connected" or asks you to connect.

**Solutions:**

1. Open the extension's **Options** page
2. If you see "Not connected," generate a new token:
   - Go to the dashboard → **Settings** → **Extension Tokens**
   - Click **Generate New Token**
   - Copy the token
   - Paste it in the extension's Options page
3. Ensure you're logged into the dashboard before generating the token

### E.6.3 Participants Not Being Tracked

**Symptom:** Some or all participants are not appearing in attendance.

**Solutions:**

1. Ensure the **People Panel** is open in Google Meet (click the people icon)
2. The extension needs the People Panel to detect participants
3. Check if the participant is in the **Exempted Accounts** list for the class
4. Verify the session is active (green status indicator)

### E.6.4 Real-Time Updates Not Appearing

**Symptom:** The Live Feed or dashboard is not updating in real time.

**Solutions:**

1. Check your internet connection
2. Refresh the dashboard page
3. Ensure WebSocket connection is active (check browser console for errors)
4. Try logging out and logging back in

### E.6.5 Incorrect Student Matching

**Symptom:** Participants are showing as "Unknown" or matched to wrong students.

**Solutions:**

1. Ensure student names in your roster match how they appear in Google Meet
2. Google Meet displays names based on Google account names
3. You can add alternative names or nicknames to student records
4. For unmatched participants, you can manually assign them after the session

### E.6.6 Session Won't End

**Symptom:** Clicking "End Session" doesn't work.

**Solutions:**

1. Check your internet connection
2. Try ending from the dashboard's **Live Feed** page instead
3. Refresh the extension popup and try again
4. If the issue persists, the session can be ended from **Sessions** → find the session → **End Session**

---

## E.7 Frequently Asked Questions (FAQs)

### General Questions

**Q: What data does ENGAGIUM collect?**

A: ENGAGIUM collects only participation metadata:
- Participant names (as displayed in Google Meet)
- Join/leave timestamps
- Occurrence of chat messages (not content)
- Reaction events (emoji type only)
- Hand raise events
- Microphone unmute events

**ENGAGIUM does NOT collect:**
- Audio or video recordings
- Chat message content
- Screen content
- Personal information beyond what's displayed in Google Meet

---

**Q: Can students see their own participation data?**

A: Currently, ENGAGIUM is designed for instructor use only. Students do not have direct access to the system. However, instructors can share reports or summaries with students as needed.

---

**Q: Does ENGAGIUM work with Zoom or Microsoft Teams?**

A: The current version of ENGAGIUM supports **Google Meet only**. Support for other platforms is planned for future releases.

---

**Q: Will ENGAGIUM slow down my computer or Google Meet?**

A: ENGAGIUM is designed to be lightweight. The extension uses minimal resources and should not noticeably impact performance. If you experience issues, ensure you have adequate system resources and a stable internet connection.

---

### Technical Questions

**Q: What if I lose internet connection during a session?**

A: ENGAGIUM has offline resilience built in:
- Detected events are queued locally
- When connection is restored, events are synced to the server
- Some events may be lost if the extension is closed before syncing

---

**Q: Can I run ENGAGIUM on multiple computers?**

A: Yes. You can install the extension on multiple computers and connect them to the same account. However, only one computer should track a session at a time to avoid duplicate events.

---

**Q: How do I update the extension?**

A: If installed from Chrome Web Store, updates are automatic. If installed as an unpacked extension, download the new version and reload it at `chrome://extensions/`.

---

**Q: Can I delete or correct attendance records?**

A: Currently, attendance records are automatically generated. Manual editing features are planned for future releases. For now, contact your system administrator for corrections.

---

### Privacy and Security

**Q: Is my data secure?**

A: Yes. ENGAGIUM implements:
- Encrypted data transmission (HTTPS)
- Hashed passwords (bcrypt)
- Token-based authentication
- Database access controls
- No storage of sensitive meeting content

---

**Q: Who can see my class data?**

A: Only you (the instructor) can see your classes, students, and session data. System administrators may have access for support purposes, but this depends on your institution's deployment.

---

**Q: Does ENGAGIUM comply with the Data Privacy Act of 2012 (Philippines)?**

A: ENGAGIUM is designed with privacy principles in mind:
- Collects only necessary data
- Does not record audio/video
- Provides transparency on data collected
- Institutions should implement appropriate consent procedures

Please consult with your institution's Data Protection Officer for compliance guidance.

---

**Q: Can I export my data?**

A: Yes. You can export attendance and participation data as CSV files from the session details or analytics pages.

---

**Q: How do I delete my account?**

A: Contact your system administrator to request account deletion. This will remove all your data from the system.
