-- =============================================================================
-- Engagium Migration Script: 003_fix_attendance_fk
-- =============================================================================
-- Created: November 30, 2025
-- Purpose: Change attendance_records.student_id FK from CASCADE to SET NULL
--          This preserves attendance history when a student is deleted
-- =============================================================================

BEGIN;

-- Drop the existing foreign key constraint
ALTER TABLE attendance_records 
DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey;

-- Add it back with ON DELETE SET NULL
ALTER TABLE attendance_records 
ADD CONSTRAINT attendance_records_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

COMMIT;

-- Verify
DO $$
DECLARE
    fk_action TEXT;
BEGIN
    SELECT confdeltype INTO fk_action
    FROM pg_constraint 
    WHERE conname = 'attendance_records_student_id_fkey';
    
    IF fk_action = 'n' THEN
        RAISE NOTICE 'SUCCESS: FK constraint is now ON DELETE SET NULL';
    ELSE
        RAISE WARNING 'UNEXPECTED: FK delete action is %', fk_action;
    END IF;
END $$;
