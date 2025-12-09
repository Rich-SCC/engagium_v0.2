# Student Roster Testing Plan

**Feature:** Student Roster Bug Fixes  
**Date:** December 9, 2025  
**Status:** Ready for Testing

---

## Pre-Testing Setup

1. ✅ Database migration applied (`add_deleted_at_to_students.sql`)
2. ⏳ Backend server restarted
3. ⏳ Frontend rebuilt and served
4. ⏳ Test data prepared (class with students, some with participation logs)

---

## Test Cases

### 1. Student Deletion (Soft Delete)

**Test 1.1: Delete student without participation logs**
- [ ] Go to a class roster
- [ ] Select a student with no participation logs
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] **Expected:** Student disappears from roster immediately
- [ ] **Expected:** Success message shown (or no error)

**Test 1.2: Delete student with participation logs**
- [ ] Select a student who has participated in sessions
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] **Expected:** Student disappears from roster immediately
- [ ] **Expected:** No error about participation logs
- [ ] **Expected:** Historical participation data still accessible in session details

**Test 1.3: Bulk delete students**
- [ ] Select multiple students (some with logs, some without)
- [ ] Click bulk delete button
- [ ] Confirm deletion
- [ ] **Expected:** All selected students disappear
- [ ] **Expected:** No error messages

**Test 1.4: Verify soft delete in database**
```sql
SELECT id, full_name, deleted_at FROM students WHERE deleted_at IS NOT NULL;
```
- [ ] **Expected:** Deleted students have a `deleted_at` timestamp
- [ ] **Expected:** Participation logs still reference these student IDs

---

### 2. Student Rename (No student_id constraints)

**Test 2.1: Edit student name**
- [ ] Click edit on a student
- [ ] **Expected:** Form shows only "Full Name" field (no Student ID field)
- [ ] Change the name
- [ ] Save
- [ ] **Expected:** Name updates successfully
- [ ] **Expected:** No constraint errors

**Test 2.2: Rename to existing name**
- [ ] Edit a student to have the same name as another student
- [ ] Save
- [ ] **Expected:** Should save successfully (duplicates allowed, no unique constraint on name)

---

### 3. Student Merge

**Test 3.1: Merge two students**
- [ ] Click "Merge" button in toolbar
- [ ] **Expected:** Modal shows student list without student IDs in parentheses
- [ ] Select "Keep" student
- [ ] Select "Merge" student (to be deleted)
- [ ] **Expected:** Preview shows only names, no IDs
- [ ] Confirm merge
- [ ] **Expected:** Merge completes successfully
- [ ] **Expected:** Kept student now has combined participation logs
- [ ] **Expected:** Merged student is soft-deleted (not in roster)

**Test 3.2: Verify merge error handling**
- [ ] Try to merge by selecting same student in both dropdowns
- [ ] **Expected:** Error message: "Cannot merge a student with itself"

**Test 3.3: Verify data transfer in database**
```sql
-- Check participation logs transferred
SELECT s.full_name, COUNT(pl.id) as log_count
FROM students s
LEFT JOIN participation_logs pl ON s.id = pl.student_id
WHERE s.id = '<kept_student_id>'
GROUP BY s.id, s.full_name;

-- Check merged student soft-deleted
SELECT full_name, deleted_at 
FROM students 
WHERE id = '<merged_student_id>';
```
- [ ] **Expected:** Kept student has combined log count
- [ ] **Expected:** Merged student has `deleted_at` timestamp

---

### 4. Participation vs Attendance Counts

**Test 4.1: Verify column headers**
- [ ] Go to student roster
- [ ] **Expected:** Two separate columns: "Participation" and "Attendance"

**Test 4.2: Check participation count accuracy**
- [ ] Note a student's participation count
- [ ] Go to that student's session participation logs
- [ ] Count non-join/leave events (chat, reactions, hand raises, mic toggles)
- [ ] **Expected:** Count matches the "Participation" column value

**Test 4.3: Check attendance count accuracy**
- [ ] Note a student's attendance count
- [ ] Go to participation logs
- [ ] Count join/leave events only
- [ ] **Expected:** Count matches the "Attendance" column value

**Test 4.4: Verify in database**
```sql
SELECT 
  s.full_name,
  COUNT(CASE WHEN pl.interaction_type NOT IN ('join', 'leave') THEN 1 END) as participation,
  COUNT(CASE WHEN pl.interaction_type IN ('join', 'leave') THEN 1 END) as attendance
FROM students s
LEFT JOIN participation_logs pl ON s.id = pl.student_id
WHERE s.class_id = '<class_id>' AND s.deleted_at IS NULL
GROUP BY s.id, s.full_name;
```
- [ ] **Expected:** Counts match UI display

---

### 5. Student Creation

**Test 5.1: Add new student**
- [ ] Click "Add Student" button
- [ ] **Expected:** Form shows only "Full Name" field (no Student ID)
- [ ] Enter a name
- [ ] Save
- [ ] **Expected:** Student created successfully
- [ ] **Expected:** Student appears in roster

**Test 5.2: Add student with duplicate name**
- [ ] Add a student with a name that already exists
- [ ] **Expected:** Student created successfully (duplicates allowed)

---

### 6. CSV Import/Export

**Test 6.1: Export students**
- [ ] Click "Export" button
- [ ] **Expected:** CSV file downloaded
- [ ] Open CSV file
- [ ] **Expected:** Only contains `full_name` column (no `student_id` column)

**Test 6.2: Import students from CSV**
- [ ] Create CSV with header `full_name`
- [ ] Add several student names
- [ ] Import CSV
- [ ] **Expected:** All students imported successfully
- [ ] **Expected:** Students appear in roster

**Test 6.3: Import CSV with old format (has student_id column)**
- [ ] Use a CSV with both `full_name` and `student_id` columns
- [ ] Import CSV
- [ ] **Expected:** Import succeeds (student_id column ignored)

---

### 7. Error Handling

**Test 7.1: Delete error displays to user**
- [ ] Simulate a network error during delete (disconnect internet briefly)
- [ ] Try to delete a student
- [ ] **Expected:** Error message displayed to user via alert

**Test 7.2: Update error displays to user**
- [ ] Simulate a network error during update
- [ ] Try to edit a student
- [ ] **Expected:** Error message displayed to user via alert

**Test 7.3: Merge error displays to user**
- [ ] Simulate a network error during merge
- [ ] Try to merge students
- [ ] **Expected:** Error message displayed to user via alert

---

### 8. Student Count Accuracy

**Test 8.1: Verify class student count excludes deleted**
- [ ] Note the student count shown on class card
- [ ] Delete a student
- [ ] Refresh or navigate back
- [ ] **Expected:** Student count decreased by 1
- [ ] **Expected:** Count doesn't include soft-deleted students

**Test 8.2: Verify in database**
```sql
SELECT COUNT(*) as count 
FROM students 
WHERE class_id = '<class_id>' AND deleted_at IS NULL;
```
- [ ] **Expected:** Matches student count displayed in UI

---

## Regression Testing

### Existing Features (Should Still Work)

- [ ] Student tags assignment
- [ ] Student notes creation/viewing
- [ ] Student search/filter
- [ ] Student sorting
- [ ] Session attendance tracking
- [ ] Live participation tracking during sessions
- [ ] Student roster pagination (if implemented)

---

## Performance Testing

**Test 9.1: Query performance with soft deletes**
- [ ] Create a class with 100+ students
- [ ] Soft delete 50+ students
- [ ] Load student roster
- [ ] **Expected:** Page loads in < 2 seconds
- [ ] **Expected:** No visible lag

---

## Edge Cases

**Test 10.1: Merge soft-deleted students**
- [ ] Try to merge two students where one is soft-deleted
- [ ] **Expected:** Soft-deleted students shouldn't appear in merge dropdown

**Test 10.2: Restore deleted student (manual)**
```sql
UPDATE students SET deleted_at = NULL WHERE id = '<student_id>';
```
- [ ] Restore a soft-deleted student via SQL
- [ ] Refresh roster
- [ ] **Expected:** Student reappears in roster

---

## Sign-off

- [ ] All tests passed
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] Performance acceptable
- [ ] Ready for production deployment

**Tested by:** _________________  
**Date:** _________________  
**Approved by:** _________________
