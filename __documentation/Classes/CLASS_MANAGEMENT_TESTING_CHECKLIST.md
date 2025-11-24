# Class Management Feature - Testing Checklist

## Pre-Testing Setup
- [ ] Database migration completed (`migration_class_management.sql`)
- [ ] Backend server running without errors
- [ ] Frontend development server running
- [ ] Logged in as instructor user
- [ ] Test data prepared (CSV file with student data)

---

## 1. Class CRUD Operations

### Create Class
- [ ] Navigate to "My Classes" page
- [ ] Click "Create Class" button
- [ ] Modal opens correctly
- [ ] Enter class name (required field validation works)
- [ ] Enter subject and section
- [ ] Enter description
- [ ] Select schedule days (can select multiple)
- [ ] Enter schedule time
- [ ] Submit form
- [ ] Class appears in class list
- [ ] All entered data displays correctly
- [ ] Student count shows 0

### Edit Class
- [ ] Click menu (three dots) on class card
- [ ] Select "Edit Class"
- [ ] Modal opens with existing data
- [ ] Modify class information
- [ ] Change schedule
- [ ] Submit changes
- [ ] Changes reflect immediately
- [ ] Close and reopen to verify persistence

### View Class Details
- [ ] Click on class card
- [ ] Navigate to class details page
- [ ] Class information displays correctly
- [ ] Schedule displays properly
- [ ] Student count is accurate
- [ ] Action buttons are visible

### Archive Class
- [ ] Click menu on class card
- [ ] Select "Archive"
- [ ] Class disappears from active list
- [ ] Click "Show Archived" toggle
- [ ] Archived class appears with "Archived" badge
- [ ] Class card shows slightly faded
- [ ] Click menu and select "Unarchive"
- [ ] Class returns to active list

### Delete Class
- [ ] Create a test class (without sessions)
- [ ] Click menu and select "Delete"
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Class is removed from list
- [ ] Create class with sessions (test deletion protection)
- [ ] Attempt to delete
- [ ] Error message: "Cannot delete class with existing sessions"

---

## 2. Session Links Management

### Add Session Link
- [ ] Open class details
- [ ] Click "Links" button
- [ ] Session Links modal opens
- [ ] Enter link URL (required field validation)
- [ ] Select link type (Zoom/Meet/Teams/Other)
- [ ] Enter label
- [ ] For Zoom: enter Meeting ID and Passcode
- [ ] Click "Add Link"
- [ ] Link appears in list
- [ ] Primary star is hollow (not primary yet)

### Set Primary Link
- [ ] Click hollow star icon on a link
- [ ] Star becomes solid gold
- [ ] Previous primary link (if any) loses primary status
- [ ] Only one primary link exists at a time

### View Link Details
- [ ] Link URL is clickable
- [ ] Opens in new tab
- [ ] For Zoom links: Meeting ID and Passcode display
- [ ] Label displays correctly
- [ ] Link type badge shows

### Edit Link
- [ ] Click on a link
- [ ] Modify link URL
- [ ] Change link type
- [ ] Update Zoom details
- [ ] Toggle primary status
- [ ] Changes save correctly

### Delete Link
- [ ] Click delete (trash) icon on a link
- [ ] Confirmation appears
- [ ] Confirm deletion
- [ ] Link removed from list

### Multiple Links
- [ ] Add 3-5 different links
- [ ] Each link displays correctly
- [ ] Can set different link as primary
- [ ] All links remain after refresh
- [ ] Links sorted (primary first)

---

## 3. Student Management

### Add Student Manually
- [ ] Open class details
- [ ] Click "Add Student" (if implemented)
- [ ] Enter first name and last name (required)
- [ ] Enter email and student ID (optional)
- [ ] Submit
- [ ] Student appears in roster
- [ ] Student count increments

### CSV Import - Valid File
- [ ] Prepare valid CSV file:
  ```
  first_name,last_name,email,student_id
  John,Doe,john@test.com,12345
  Jane,Smith,jane@test.com,12346
  ```
- [ ] Click "Import CSV"
- [ ] Select file
- [ ] Preview displays correctly (2 students)
- [ ] All fields show in preview table
- [ ] Click "Import X Students"
- [ ] Import completes successfully
- [ ] Results summary shows: 2 successful, 0 failed
- [ ] Students appear in roster
- [ ] Student count updates

### CSV Import - Invalid File
- [ ] Prepare CSV without required headers
- [ ] Attempt import
- [ ] Error message displays
- [ ] Prepare CSV with malformed data
- [ ] Import shows preview
- [ ] Failed imports listed with reasons
- [ ] Successful imports still processed

### CSV Import - Duplicate Student IDs
- [ ] Import CSV with duplicate student_id
- [ ] First occurrence succeeds
- [ ] Second occurrence fails with error
- [ ] Error message: "Student ID already exists in this class"

### CSV Export
- [ ] Class has students
- [ ] Click "Export CSV"
- [ ] File downloads
- [ ] Open file in spreadsheet
- [ ] All students present
- [ ] Headers correct: first_name,last_name,email,student_id
- [ ] Data matches roster

### View Student Roster
- [ ] Student table displays all students
- [ ] Names display correctly
- [ ] Email and Student ID show (or "-" if empty)
- [ ] Table is sortable
- [ ] Pagination works (if many students)

### Bulk Delete Students
- [ ] Select multiple students using checkboxes
- [ ] "Delete (X)" button appears
- [ ] Click delete button
- [ ] Confirmation dialog shows count
- [ ] Confirm deletion
- [ ] Selected students removed
- [ ] Student count updates
- [ ] Unselected students remain

### Delete Single Student
- [ ] Click "Delete" on a student row
- [ ] Confirmation appears
- [ ] Confirm deletion
- [ ] Student removed from roster
- [ ] Try deleting student with participation logs
- [ ] Error: "Cannot delete student with participation logs"

### Select All Students
- [ ] Click checkbox in table header
- [ ] All students selected
- [ ] Click again
- [ ] All students deselected

---

## 4. Exempted Accounts Management

### Add Exemption
- [ ] Open class details
- [ ] Click "Exemptions" button
- [ ] Exemption modal opens
- [ ] Enter account identifier (email or name)
- [ ] Enter reason (e.g., "TA")
- [ ] Click "Add Exemption"
- [ ] Exemption appears in list
- [ ] Account identifier displays
- [ ] Reason displays as badge
- [ ] Created date shows

### Add Duplicate Exemption
- [ ] Attempt to add same account identifier again
- [ ] Error message: "This account is already exempted for this class"
- [ ] Exemption not added

### View Exemptions List
- [ ] All exemptions display
- [ ] Account identifiers shown
- [ ] Reasons displayed
- [ ] Created dates accurate
- [ ] List ordered by creation date

### Delete Exemption
- [ ] Click delete (trash) icon on exemption
- [ ] Confirmation appears
- [ ] Confirm deletion
- [ ] Exemption removed from list

### Multiple Exemptions
- [ ] Add 3-5 different exemptions
- [ ] Each displays correctly
- [ ] Different reasons show
- [ ] Can delete any exemption
- [ ] Exemptions persist after refresh

### Exemption Info Box
- [ ] Info box displays at bottom of modal
- [ ] Explains how exemptions work
- [ ] Instructions clear and helpful

---

## 5. UI/UX Testing

### My Classes Page
- [ ] Class cards display in grid layout
- [ ] Responsive on different screen sizes
- [ ] Cards show class name, subject, section
- [ ] Schedule displays (days and time)
- [ ] Student count displays
- [ ] Archived badge shows for archived classes
- [ ] Hover effects work on cards
- [ ] Click card navigates to details

### Class Details Page
- [ ] Header shows class name and info
- [ ] Back button works
- [ ] Action buttons arranged properly
- [ ] Class info card displays description and schedule
- [ ] Student section has proper header
- [ ] Empty state shows when no students
- [ ] Table layouts properly
- [ ] Responsive on mobile

### Modals
- [ ] All modals open smoothly
- [ ] Close button (X) works
- [ ] Click outside modal closes it (if implemented)
- [ ] ESC key closes modal (if implemented)
- [ ] Modal content scrolls if too long
- [ ] Form validation messages appear
- [ ] Loading states show during operations
- [ ] Success/error messages display

### Navigation
- [ ] Can navigate back to My Classes
- [ ] Browser back/forward works
- [ ] URL updates correctly
- [ ] Direct URL access works

---

## 6. Data Validation & Error Handling

### Required Fields
- [ ] Cannot submit class without name
- [ ] Cannot add link without URL
- [ ] Cannot add exemption without identifier
- [ ] Cannot add student without first/last name
- [ ] Error messages display for missing fields

### Format Validation
- [ ] Email validation (if implemented)
- [ ] URL validation for links
- [ ] Student ID format (if restricted)

### Server Errors
- [ ] Network errors display user-friendly message
- [ ] 401 Unauthorized redirects to login
- [ ] 403 Forbidden shows access denied
- [ ] 404 Not Found shows appropriate message
- [ ] 500 Server Error shows generic error

### Loading States
- [ ] Loading indicators during API calls
- [ ] Buttons disabled during submission
- [ ] Spinners or skeletons show when loading data

---

## 7. Performance Testing

### Large Dataset
- [ ] Create class with 100+ students
- [ ] Roster loads in reasonable time
- [ ] Pagination or virtualization works
- [ ] Search/filter performs well
- [ ] Export completes successfully

### Multiple Classes
- [ ] Create 20+ classes
- [ ] My Classes page loads quickly
- [ ] Grid layout remains organized
- [ ] Filter/search works

### Concurrent Operations
- [ ] Import students while managing links
- [ ] Edit class while viewing roster
- [ ] Multiple modals can be opened in sequence
- [ ] No race conditions or conflicts

---

## 8. Authorization Testing

### Access Control
- [ ] Cannot access another instructor's classes
- [ ] Direct URL to other's class returns 403
- [ ] API returns proper auth errors
- [ ] Logout clears access properly

### Token Refresh
- [ ] Long session maintains access
- [ ] Token refresh works automatically
- [ ] No interruption to user experience

---

## 9. Edge Cases

### Schedule
- [ ] Can save class with no schedule
- [ ] Can save schedule with days but no time
- [ ] Can save schedule with time but no days
- [ ] All days of week can be selected
- [ ] Days can be unselected

### Links
- [ ] Can have class with no links
- [ ] Can add link with no label
- [ ] Can add link without Zoom details
- [ ] Very long URLs handled properly

### Students
- [ ] Can have class with no students
- [ ] Student with no email displays properly
- [ ] Student with no student_id displays properly
- [ ] Names with special characters work

### Exemptions
- [ ] Can have class with no exemptions
- [ ] Exemption without reason displays properly
- [ ] Case-insensitive matching works

---

## 10. Cross-Browser Testing

- [ ] Chrome (latest version)
- [ ] Firefox (latest version)
- [ ] Safari (latest version)
- [ ] Edge (latest version)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## 11. Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] ARIA labels present
- [ ] Color contrast sufficient
- [ ] Screen reader compatible (if possible)

---

## 12. Data Persistence

### Refresh Testing
- [ ] Create class and refresh page
- [ ] Data persists correctly
- [ ] Add links and refresh
- [ ] Links remain
- [ ] Import students and refresh
- [ ] Students remain
- [ ] Archive class and refresh
- [ ] Status persists

### Browser Cache
- [ ] Clear browser cache
- [ ] Data still loads from server
- [ ] No stale data displays

---

## Post-Testing

### Cleanup
- [ ] Delete test classes
- [ ] Remove test students
- [ ] Clear test exemptions
- [ ] Verify database clean

### Issues Log
- [ ] Document any bugs found
- [ ] Note performance issues
- [ ] Record UX improvements needed
- [ ] File GitHub issues for fixes

---

## Test Data Templates

### Valid CSV File
```csv
first_name,last_name,email,student_id
Alice,Anderson,alice@test.com,10001
Bob,Brown,bob@test.com,10002
Charlie,Clark,charlie@test.com,10003
Diana,Davis,diana@test.com,10004
Eve,Evans,eve@test.com,10005
```

### Invalid CSV File
```csv
fname,lname,email
John,Doe,john@test.com
```

### Zoom Link Example
```
URL: https://zoom.us/j/1234567890?pwd=abcdefgh
Meeting ID: 123 456 7890
Passcode: test123
```

---

## Success Criteria
✅ All critical features working without errors  
✅ Data persists correctly across sessions  
✅ UI is responsive and user-friendly  
✅ No security vulnerabilities in access control  
✅ Performance acceptable with reasonable data volumes  
✅ Error handling provides clear user feedback
