-- Engagium Database Schema
-- PostgreSQL Schema for Phase 1 MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('instructor', 'admin');
CREATE TYPE session_status AS ENUM ('scheduled', 'active', 'ended');
CREATE TYPE interaction_type AS ENUM ('manual_entry', 'chat', 'reaction', 'mic_toggle', 'camera_toggle');

-- Users table
CREATE TABLE users (
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

-- Classes table
CREATE TABLE classes (
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
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    student_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id) -- Student ID should be unique within a class
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    meeting_link VARCHAR(500),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    status session_status DEFAULT 'scheduled' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participation logs table
CREATE TABLE participation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    interaction_type interaction_type NOT NULL,
    interaction_value VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    additional_data JSONB
);

-- Session links table (multiple links per class)
CREATE TABLE session_links (
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
CREATE TABLE exempted_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    account_identifier VARCHAR(255) NOT NULL, -- email or name
    reason VARCHAR(255), -- 'TA', 'Observer', 'Alt account', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, account_identifier)
);

-- Student tags table (flexible labeling system)
CREATE TABLE student_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_color VARCHAR(20) DEFAULT '#3B82F6', -- Hex color for UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, tag_name)
);

-- Student tag assignments (many-to-many)
CREATE TABLE student_tag_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES student_tags(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, tag_id)
);

-- Student notes table (timestamped log)
CREATE TABLE student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_sessions_class_id ON sessions(class_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_session_links_class_id ON session_links(class_id);
CREATE INDEX idx_exempted_accounts_class_id ON exempted_accounts(class_id);
CREATE INDEX idx_participation_logs_session_id ON participation_logs(session_id);
CREATE INDEX idx_participation_logs_student_id ON participation_logs(student_id);
CREATE INDEX idx_participation_logs_timestamp ON participation_logs(timestamp);
CREATE INDEX idx_participation_logs_interaction_type ON participation_logs(interaction_type);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
CREATE INDEX idx_student_tags_class_id ON student_tags(class_id);
CREATE INDEX idx_student_tag_assignments_student_id ON student_tag_assignments(student_id);
CREATE INDEX idx_student_tag_assignments_tag_id ON student_tag_assignments(tag_id);
CREATE INDEX idx_student_notes_student_id ON student_notes(student_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_links_updated_at BEFORE UPDATE ON session_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();