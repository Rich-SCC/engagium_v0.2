-- =============================================================================
-- Engagium One-Time Migration Script: 001_attendance_tracking
-- =============================================================================
-- Created: November 30, 2025
-- Purpose: Migrate from old schema (first_name/last_name/email) to new schema (full_name)
--          and add attendance tracking tables
-- 
-- IMPORTANT: Run this ONLY ONCE on an existing database
-- Usage: psql -U engagium_user -d engagium -f migrations/001_attendance_tracking.sql
-- =============================================================================

BEGIN;

-- =============================================
-- STEP 1: Migrate Students Table
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

-- 1b. Migrate data: concatenate first_name + last_name into full_name
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    -- Only migrate if old columns exist
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

-- 1c. Make full_name NOT NULL (after data migration)
DO $$
BEGIN
    -- Check if column is already NOT NULL
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

-- 1d. Drop old columns (first_name, last_name, email)
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
-- STEP 2: Create attendance_records Table
-- =============================================

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    participant_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
    total_duration_minutes INTEGER DEFAULT 0,
    first_joined_at TIMESTAMP WITH TIME ZONE,
    last_left_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, participant_name)
);

-- =============================================
-- STEP 3: Create attendance_intervals Table
-- =============================================

CREATE TABLE IF NOT EXISTS attendance_intervals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    participant_name VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 4: Create Indexes for New Tables
-- =============================================

CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id 
    ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id 
    ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_participant_name 
    ON attendance_records(participant_name);
CREATE INDEX IF NOT EXISTS idx_attendance_intervals_session_id 
    ON attendance_intervals(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_intervals_student_id 
    ON attendance_intervals(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_intervals_participant_name 
    ON attendance_intervals(participant_name);

-- =============================================
-- STEP 5: Add updated_at trigger for attendance_records
-- =============================================

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
    empty_names INTEGER;
    old_columns_exist BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO student_count FROM students;
    SELECT COUNT(*) INTO empty_names FROM students WHERE full_name IS NULL OR full_name = '';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name IN ('first_name', 'last_name', 'email')
    ) INTO old_columns_exist;
    
    RAISE NOTICE '';
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'MIGRATION COMPLETE!';
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'Total students: %', student_count;
    RAISE NOTICE 'Students with empty full_name: %', empty_names;
    RAISE NOTICE 'Old columns removed: %', NOT old_columns_exist;
    RAISE NOTICE '=============================================';
    
    IF empty_names > 0 THEN
        RAISE WARNING 'Some students have empty full_name values! Please review manually.';
    END IF;
    
    IF old_columns_exist THEN
        RAISE WARNING 'Old columns (first_name/last_name/email) still exist!';
    END IF;
END $$;
