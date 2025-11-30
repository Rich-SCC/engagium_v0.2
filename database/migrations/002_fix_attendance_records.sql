-- =============================================================================
-- Engagium Migration Script: 002_fix_attendance_records
-- =============================================================================
-- Created: November 30, 2025
-- Purpose: Fix attendance_records table to match new schema with participant_name
--          and update students table
-- =============================================================================

BEGIN;

-- =============================================
-- STEP 1: Fix Students Table (if not already done)
-- =============================================

-- 1a. Add new full_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE students ADD COLUMN full_name VARCHAR(255);
        RAISE NOTICE 'Added full_name column to students table';
    ELSE
        RAISE NOTICE 'full_name column already exists, skipping...';
    END IF;
END $$;

-- 1b. Migrate data if old columns exist
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'first_name'
    ) THEN
        UPDATE students 
        SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
        WHERE full_name IS NULL OR full_name = '';
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migrated % student records to full_name format', migrated_count;
    ELSE
        RAISE NOTICE 'Old columns not found, skipping data migration...';
    END IF;
END $$;

-- 1c. Make full_name NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' 
        AND column_name = 'full_name'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE students ALTER COLUMN full_name SET NOT NULL;
        RAISE NOTICE 'Set full_name column to NOT NULL';
    END IF;
END $$;

-- 1d. Drop old columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'first_name'
    ) THEN
        ALTER TABLE students DROP COLUMN first_name;
        RAISE NOTICE 'Dropped first_name column';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'last_name'
    ) THEN
        ALTER TABLE students DROP COLUMN last_name;
        RAISE NOTICE 'Dropped last_name column';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'email'
    ) THEN
        ALTER TABLE students DROP COLUMN email;
        RAISE NOTICE 'Dropped email column';
    END IF;
END $$;

-- =============================================
-- STEP 2: Fix attendance_records Table
-- =============================================

-- 2a. Add participant_name column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'participant_name'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN participant_name VARCHAR(255);
        RAISE NOTICE 'Added participant_name column to attendance_records';
    END IF;
END $$;

-- 2b. Add total_duration_minutes column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'total_duration_minutes'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN total_duration_minutes INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_duration_minutes column to attendance_records';
    END IF;
END $$;

-- 2c. Rename joined_at to first_joined_at if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'joined_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'first_joined_at'
    ) THEN
        ALTER TABLE attendance_records RENAME COLUMN joined_at TO first_joined_at;
        RAISE NOTICE 'Renamed joined_at to first_joined_at';
    END IF;
END $$;

-- 2d. Rename left_at to last_left_at if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'left_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'last_left_at'
    ) THEN
        ALTER TABLE attendance_records RENAME COLUMN left_at TO last_left_at;
        RAISE NOTICE 'Renamed left_at to last_left_at';
    END IF;
END $$;

-- 2e. Populate participant_name from student full_name for existing records
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE attendance_records ar
    SET participant_name = s.full_name
    FROM students s
    WHERE ar.student_id = s.id
    AND (ar.participant_name IS NULL OR ar.participant_name = '');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % attendance records with participant_name from students', updated_count;
END $$;

-- 2f. Set default for any remaining NULL participant_names
UPDATE attendance_records 
SET participant_name = 'Unknown Participant' 
WHERE participant_name IS NULL OR participant_name = '';

-- 2g. Make participant_name NOT NULL
ALTER TABLE attendance_records ALTER COLUMN participant_name SET NOT NULL;

-- 2h. Make student_id nullable (for unmatched participants)
ALTER TABLE attendance_records ALTER COLUMN student_id DROP NOT NULL;

-- 2i. Update status check constraint to include 'late'
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_status_check 
    CHECK (status IN ('present', 'absent', 'late'));

-- 2j. Drop old unique constraint and add new one based on participant_name
DO $$
BEGIN
    -- Drop old constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_records_session_id_student_id_key'
        AND table_name = 'attendance_records'
    ) THEN
        ALTER TABLE attendance_records DROP CONSTRAINT attendance_records_session_id_student_id_key;
        RAISE NOTICE 'Dropped old unique constraint on (session_id, student_id)';
    END IF;
END $$;

-- Add new unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_records_session_id_participant_name_key'
        AND table_name = 'attendance_records'
    ) THEN
        ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_session_id_participant_name_key 
            UNIQUE (session_id, participant_name);
        RAISE NOTICE 'Added new unique constraint on (session_id, participant_name)';
    END IF;
END $$;

-- =============================================
-- STEP 3: Create missing indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_attendance_records_participant_name 
    ON attendance_records(participant_name);

-- =============================================
-- STEP 4: Update trigger
-- =============================================

DROP TRIGGER IF EXISTS trigger_attendance_updated_at ON attendance_records;
DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON attendance_records;
CREATE TRIGGER update_attendance_records_updated_at 
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- =============================================
-- Verify Migration
-- =============================================
DO $$
DECLARE
    student_count INTEGER;
    ar_columns TEXT;
BEGIN
    SELECT COUNT(*) INTO student_count FROM students;
    
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO ar_columns
    FROM information_schema.columns 
    WHERE table_name = 'attendance_records';
    
    RAISE NOTICE '';
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'MIGRATION COMPLETE!';
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'Total students: %', student_count;
    RAISE NOTICE 'attendance_records columns: %', ar_columns;
    RAISE NOTICE '=============================================';
END $$;
