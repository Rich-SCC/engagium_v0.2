# Student Management Testing Checklist

Use this checklist to verify all student management features are working correctly.

## Setup Verification

- [ ] Backend server is running on port 3001
- [ ] Frontend is running on port 5173
- [ ] Database migration completed with new tables
- [ ] Test class created with instructor account
- [ ] CSV test file prepared

## CSV Import/Export

### Import
- [ ] Navigate to class details page
- [ ] Click "Import CSV" button
- [ ] Upload valid CSV file with required columns
- [ ] Verify preview shows correct data
- [ ] Click import and verify success count
- [ ] Check imported students appear in roster
- [ ] Test import with missing columns (should show error)
- [ ] Test import with malformed CSV (should show error)
- [ ] Test import with duplicate student_id (should show in failed count)
- [ ] Test import with special characters in names
- [ ] Test import with empty optional fields (email, student_id)

### Export
- [ ] Click "Export" button
- [ ] Verify CSV file downloads
- [ ] Open CSV and verify data matches roster
- [ ] Verify all fields present (first_name, last_name, email, student_id)
- [ ] Test export with empty roster (should create empty CSV with headers)

## Search Functionality

- [ ] Type in search box and verify real-time filtering
- [ ] Search by first name (should find matches)
- [ ] Search by last name (should find matches)
- [ ] Search by email (should find matches)
- [ ] Search by student ID (should find matches)
- [ ] Search with partial match (should work)
- [ ] Search with no results (should show "No students found")
- [ ] Clear search (should show all students)
- [ ] Verify search is case-insensitive

## Sorting

- [ ] Sort by Last Name (A-Z) - verify order
- [ ] Sort by First Name (A-Z) - verify order
- [ ] Sort by Student ID - verify order
- [ ] Sort by Email - verify order
- [ ] Sort by Participation Count - verify order
- [ ] Sort by Notes Count - verify order
- [ ] Verify sorting persists during search

## Student Tags

### Tag Management
- [ ] Click "Tags" button
- [ ] Create new tag with name and color
- [ ] Verify tag appears in list
- [ ] Edit tag name and color
- [ ] Verify changes saved
- [ ] Delete tag (should prompt confirmation)
- [ ] Verify tag removed from list
- [ ] Try creating duplicate tag name (should show error)
- [ ] Verify student count updates correctly

### Tag Assignment
- [ ] Assign tag to single student from student row
- [ ] Verify tag appears under student name
- [ ] Remove tag from student
- [ ] Verify tag removed from display
- [ ] Select multiple students
- [ ] Use bulk actions bar to assign tag
- [ ] Verify tag applied to all selected students
- [ ] Use bulk actions bar to remove tag
- [ ] Verify tag removed from all selected students

### Tag Filtering
- [ ] Click "Filters" button
- [ ] Filter by specific tag
- [ ] Verify only students with that tag shown
- [ ] Clear filter
- [ ] Verify all students shown again

## Student Notes

### Adding Notes
- [ ] Click notes icon on student row
- [ ] Notes modal opens
- [ ] Add new note text
- [ ] Click "Add Note"
- [ ] Verify note appears in list with timestamp
- [ ] Verify creator name shown correctly
- [ ] Add multiple notes to same student
- [ ] Verify notes in chronological order (newest first)

### Editing Notes
- [ ] Click edit icon on note
- [ ] Modify note text
- [ ] Click "Update Note"
- [ ] Verify changes saved
- [ ] Verify timestamp updated or kept (check requirements)

### Deleting Notes
- [ ] Click delete icon on note
- [ ] Confirm deletion
- [ ] Verify note removed from list
- [ ] Verify note count badge updates

### Notes Display
- [ ] Verify note count badge shows on student row
- [ ] Verify badge shows correct count
- [ ] Verify badge hidden when count is 0
- [ ] Close and reopen notes modal
- [ ] Verify notes persist

### Notes Filtering
- [ ] Use filter to show only students with notes
- [ ] Verify correct students shown
- [ ] Use filter to show only students without notes
- [ ] Verify correct students shown
- [ ] Clear filter

## Bulk Operations

### Selection
- [ ] Click checkbox on individual student (should select)
- [ ] Click again (should deselect)
- [ ] Click "select all" checkbox in header
- [ ] Verify all students selected
- [ ] Click "select all" again
- [ ] Verify all students deselected
- [ ] Select some students
- [ ] Verify bulk actions bar appears at bottom

### Bulk Actions Bar
- [ ] Verify selected count displays correctly
- [ ] Click tag dropdown
- [ ] Verify tag list appears
- [ ] Select tag
- [ ] Verify tag applied to all selected students
- [ ] Click "Delete" button
- [ ] Confirm deletion
- [ ] Verify selected students deleted
- [ ] Verify bulk actions bar disappears after action

### Bulk Delete
- [ ] Select multiple students
- [ ] Click delete in bulk actions bar
- [ ] Confirm deletion
- [ ] Verify students removed from roster
- [ ] Try to delete student with participation logs (should show error)

## Duplicate Detection & Merge

### Detection
- [ ] Add student with same email as existing student
- [ ] Verify duplicate warning (if implemented in UI)
- [ ] Check duplicate via API endpoint

### Merge
- [ ] Click "Merge" button
- [ ] Select student to keep
- [ ] Select student to merge
- [ ] Verify both students' info displayed
- [ ] Verify warning message about irreversible action
- [ ] Click "Merge Students"
- [ ] Confirm merge
- [ ] Verify merged student deleted
- [ ] Verify kept student has combined data
- [ ] Check participation logs transferred
- [ ] Check notes transferred
- [ ] Check tags transferred

## Student Deletion

### Single Delete
- [ ] Click delete button on student row
- [ ] Confirm deletion
- [ ] Verify student removed
- [ ] Try to delete student with participation logs
- [ ] Verify error message shown
- [ ] Verify student NOT deleted

### Protection
- [ ] Create participation log for student (requires session)
- [ ] Try to delete that student
- [ ] Verify deletion blocked
- [ ] Verify clear error message

## Participation Count Display

- [ ] Verify participation count column visible
- [ ] Verify count shows 0 for new students (gray)
- [ ] Add participation log (requires session feature)
- [ ] Verify count increases
- [ ] Verify color coding:
  - [ ] 0 = gray
  - [ ] 1-4 = yellow
  - [ ] 5-9 = blue
  - [ ] 10+ = green

## Quick Stats

- [ ] Verify student count shown in section header
- [ ] Verify count updates after import
- [ ] Verify count updates after delete
- [ ] Verify count updates after filter/search
- [ ] Verify "Showing X students" message correct

## Responsive Design

- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify toolbar buttons collapse appropriately
- [ ] Verify table scrolls horizontally on small screens
- [ ] Verify modals responsive
- [ ] Verify bulk actions bar positioning

## Performance Testing

- [ ] Import CSV with 100 students (should be fast)
- [ ] Import CSV with 500 students (check performance)
- [ ] Search with large roster (should be instant)
- [ ] Sort with large roster (should be instant)
- [ ] Filter with large roster (should be fast)
- [ ] Check page load time with 100+ students

## Error Handling

### Network Errors
- [ ] Disconnect network
- [ ] Try to load students (should show error)
- [ ] Try to add student (should show error)
- [ ] Reconnect and verify recovery

### Validation Errors
- [ ] Try to add student without first name (should show error)
- [ ] Try to add student without last name (should show error)
- [ ] Try to create tag without name (should show error)
- [ ] Try to add note without text (should show error)

### Permission Errors
- [ ] Login as different instructor
- [ ] Try to access another instructor's class
- [ ] Verify access denied
- [ ] Verify proper error message

## Security Testing

- [ ] Verify students scoped to correct class
- [ ] Verify cannot access students from other classes
- [ ] Verify tags scoped to correct class
- [ ] Verify notes require authentication
- [ ] Verify only note creator can edit/delete note
- [ ] Verify admin can edit any note
- [ ] Check SQL injection attempts (should be safe)
- [ ] Check XSS attempts in names/notes (should be escaped)

## Database Integrity

- [ ] Verify foreign key constraints work
- [ ] Delete class - verify students deleted (cascade)
- [ ] Delete tag - verify assignments deleted (cascade)
- [ ] Delete student - verify notes deleted (cascade)
- [ ] Delete student - verify tag assignments deleted (cascade)
- [ ] Verify unique constraints enforced (tag names, student IDs)

## UI/UX Testing

### Visual
- [ ] Verify all buttons have hover states
- [ ] Verify loading states shown during operations
- [ ] Verify success messages after operations
- [ ] Verify error messages styled correctly
- [ ] Verify modal animations smooth
- [ ] Verify no layout shifts

### Usability
- [ ] Verify tooltips on icon buttons
- [ ] Verify clear button labels
- [ ] Verify confirmation dialogs clear
- [ ] Verify empty states helpful
- [ ] Verify error messages actionable
- [ ] Verify keyboard navigation works

## Integration Testing

### With Class Management
- [ ] Verify students list only for correct class
- [ ] Archive class - verify students preserved
- [ ] Delete class - verify students deleted

### With Session Management (Future)
- [ ] Verify participation counts from sessions
- [ ] Verify session links work
- [ ] Verify exempted accounts excluded

## Browser Testing

- [ ] Test in Chrome (latest)
- [ ] Test in Firefox (latest)
- [ ] Test in Safari (latest)
- [ ] Test in Edge (latest)
- [ ] Verify CSV export works in all browsers
- [ ] Verify modals work in all browsers

## Regression Testing

After any changes:
- [ ] Re-run critical path: import → search → tag → note → merge
- [ ] Verify existing students not affected
- [ ] Verify existing tags not affected
- [ ] Verify existing notes not affected
- [ ] Check console for errors
- [ ] Check network tab for failed requests

## Edge Cases

- [ ] Student with very long name (should truncate or wrap)
- [ ] Student with special characters in name (àéîôü)
- [ ] Student with emoji in name 😀 (should handle or reject)
- [ ] CSV with thousands of rows (should handle or paginate)
- [ ] Tag with very long name (should truncate)
- [ ] Note with very long text (should wrap)
- [ ] Multiple instructors editing same student (concurrency)
- [ ] Rapid clicking buttons (debouncing)

## Accessibility Testing

- [ ] Tab navigation through roster
- [ ] Screen reader announces student count
- [ ] Screen reader announces filter status
- [ ] Focus visible on all interactive elements
- [ ] Modal traps focus correctly
- [ ] ESC key closes modals
- [ ] ARIA labels present where needed

## Final Validation

- [ ] All features work end-to-end
- [ ] No console errors
- [ ] No network errors in DevTools
- [ ] No React warnings
- [ ] Performance acceptable
- [ ] UI polished and consistent
- [ ] Documentation matches implementation
- [ ] Ready for production use

## Known Issues / Bugs

Document any issues found during testing:
1. 
2. 
3. 

## Test Data Cleanup

After testing:
- [ ] Delete test students
- [ ] Delete test tags
- [ ] Delete test notes
- [ ] Delete test class (if needed)
- [ ] Reset database to clean state
