-- Engagium Database Initialization Script
-- Complete setup for fresh PostgreSQL installation
-- Run as postgres superuser: psql -U postgres -f init-database.sql

-- ============================================================================
-- PART 1: Database and User Setup
-- ============================================================================

-- Drop existing database if it exists (CAUTION: This will delete all data!)
DROP DATABASE IF EXISTS engagium;

-- Drop existing user if exists
DROP USER IF EXISTS engagium_user;

-- Create database
CREATE DATABASE engagium;

-- Create user with password
-- IMPORTANT: Change this password to something secure in production!
CREATE USER engagium_user WITH PASSWORD 'engagium_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE engagium TO engagium_user;

-- Connect to the database
\c engagium

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO engagium_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO engagium_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO engagium_user;

\echo '============================================================================'
\echo 'Database and user created successfully!'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- PART 2: Schema Setup
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('instructor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('scheduled', 'active', 'ended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE interaction_type AS ENUM ('manual_entry', 'chat', 'reaction', 'mic_toggle', 'camera_toggle', 'hand_raise', 'join', 'leave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'instructor' NOT NULL,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extension tokens table (for Chrome extension authentication)
CREATE TABLE IF NOT EXISTS extension_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash of the token
    token_preview VARCHAR(8) NOT NULL, -- First 8 chars for display
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    section VARCHAR(50),
    description TEXT,
    schedule JSONB, -- {days: ['monday', 'wednesday'], time: '10:00 AM'}
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(50),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id) -- Student ID should be unique within a class
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    meeting_link VARCHAR(500),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    status session_status DEFAULT 'scheduled' NOT NULL,
    session_date DATE,
    session_time TIME,
    topic VARCHAR(255),
    description TEXT,
    additional_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance records table (final status per student per session)
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

-- Attendance intervals table (tracks each join/leave for duration calculation)
CREATE TABLE IF NOT EXISTS attendance_intervals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    participant_name VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participation logs table
CREATE TABLE IF NOT EXISTS participation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    interaction_type interaction_type NOT NULL,
    interaction_value VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    additional_data JSONB
);

-- Session links table (multiple links per class)
CREATE TABLE IF NOT EXISTS session_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    link_url VARCHAR(500) NOT NULL,
    link_type VARCHAR(50), -- 'zoom', 'meet', 'teams', etc.
    label VARCHAR(100),
    zoom_meeting_id VARCHAR(100),
    zoom_passcode VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exempted accounts table (exclude from tracking)
CREATE TABLE IF NOT EXISTS exempted_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    account_identifier VARCHAR(255) NOT NULL, -- email or name
    reason VARCHAR(255), -- 'TA', 'Observer', 'Alt account', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, account_identifier)
);

-- Student tags table (flexible labeling system)
CREATE TABLE IF NOT EXISTS student_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_color VARCHAR(20) DEFAULT '#3B82F6', -- Hex color for UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, tag_name)
);

-- Student tag assignments (many-to-many)
CREATE TABLE IF NOT EXISTS student_tag_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES student_tags(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, tag_id)
);

-- Student notes table (timestamped log)
CREATE TABLE IF NOT EXISTS student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_deleted_at ON students(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_links_class_id ON session_links(class_id);
CREATE INDEX IF NOT EXISTS idx_exempted_accounts_class_id ON exempted_accounts(class_id);
CREATE INDEX IF NOT EXISTS idx_participation_logs_session_id ON participation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_participation_logs_student_id ON participation_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_participation_logs_timestamp ON participation_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_participation_logs_interaction_type ON participation_logs(interaction_type);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
CREATE INDEX IF NOT EXISTS idx_student_tags_class_id ON student_tags(class_id);
CREATE INDEX IF NOT EXISTS idx_student_tag_assignments_student_id ON student_tag_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_tag_assignments_tag_id ON student_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_participant_name ON attendance_records(participant_name);
CREATE INDEX IF NOT EXISTS idx_attendance_intervals_session_id ON attendance_intervals(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_intervals_student_id ON attendance_intervals(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_intervals_participant_name ON attendance_intervals(participant_name);
CREATE INDEX IF NOT EXISTS idx_extension_tokens_user_id ON extension_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_tokens_token_hash ON extension_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_extension_tokens_expires_at ON extension_tokens(expires_at);

-- Create updated_at trigger function (must exist before creating triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_classes_updated_at') THEN
        CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_session_links_updated_at') THEN
        CREATE TRIGGER update_session_links_updated_at BEFORE UPDATE ON session_links
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_attendance_records_updated_at') THEN
        CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Grant all privileges on tables to engagium_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO engagium_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO engagium_user;

\echo '============================================================================'
\echo 'Schema created successfully!'
\echo '============================================================================'
\echo ''
\echo 'INITIALIZATION COMPLETE!'
\echo ''
\echo 'Database: engagium'
\echo 'User: engagium_user'
\echo 'Password: engagium_password (CHANGE THIS IN PRODUCTION!)'
\echo ''
\echo 'Update your backend/.env file with:'
\echo 'DATABASE_URL=postgresql://engagium_user:engagium_password@localhost:5432/engagium'
\echo ''
