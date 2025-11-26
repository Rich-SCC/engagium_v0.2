-- Engagium Seed Data Script
-- This script populates the database with realistic dummy data for testing
-- Run this after schema.sql: psql -U engagium_user -d engagium -f seed-data.sql

-- IMPORTANT: The password for all test users is 'Password123!'
-- The hash below is bcrypt hash with 10 rounds

-- Clear existing data (in correct order to respect foreign keys)
TRUNCATE TABLE 
    notifications,
    student_notes,
    student_tag_assignments,
    student_tags,
    exempted_accounts,
    participation_logs,
    session_links,
    sessions,
    students,
    classes,
    users
CASCADE;

-- Insert test users (instructors)
-- Password for all users: 'Password123!'
-- Hash: $2b$10$YQ5p3Z5rN5Z5Z5Z5Z5Z5Z.5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z (Note: you'll need to generate real bcrypt hashes)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'john.doe@university.edu', '$2b$10$rKvFJZ2fWf7ufVd1PHX3uOXGHvJYGZGvxvJqjBqX8Z0oj4Q4Y4xZa', 'John', 'Doe', 'instructor', NOW() - INTERVAL '6 months'),
('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'sarah.smith@university.edu', '$2b$10$rKvFJZ2fWf7ufVd1PHX3uOXGHvJYGZGvxvJqjBqX8Z0oj4Q4Y4xZa', 'Sarah', 'Smith', 'instructor', NOW() - INTERVAL '4 months'),
('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'michael.johnson@university.edu', '$2b$10$rKvFJZ2fWf7ufVd1PHX3uOXGHvJYGZGvxvJqjBqX8Z0oj4Q4Y4xZa', 'Michael', 'Johnson', 'instructor', NOW() - INTERVAL '1 year');

-- Insert classes
INSERT INTO classes (id, instructor_id, name, subject, section, description, schedule, status, created_at) VALUES
('10000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 
 'Introduction to Computer Science', 'Computer Science', 'CS101-A', 
 'Fundamentals of programming, algorithms, and problem-solving using Python.',
 '{"days": ["monday", "wednesday", "friday"], "time": "9:00 AM"}', 'active', NOW() - INTERVAL '4 months'),

('10000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
 'Data Structures and Algorithms', 'Computer Science', 'CS201-B',
 'Advanced data structures, algorithm analysis, and computational complexity.',
 '{"days": ["tuesday", "thursday"], "time": "2:00 PM"}', 'active', NOW() - INTERVAL '3 months'),

('10000000-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
 'Calculus I', 'Mathematics', 'MATH101-C',
 'Limits, derivatives, integrals, and applications of calculus.',
 '{"days": ["monday", "wednesday", "friday"], "time": "11:00 AM"}', 'active', NOW() - INTERVAL '3 months'),

('10000000-0000-0000-0000-000000000004', 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
 'English Composition', 'English', 'ENG101-D',
 'Academic writing, critical thinking, and rhetorical analysis.',
 '{"days": ["tuesday", "thursday"], "time": "10:00 AM"}', 'active', NOW() - INTERVAL '2 months'),

('10000000-0000-0000-0000-000000000005', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
 'Linear Algebra', 'Mathematics', 'MATH201-E',
 'Vector spaces, matrices, linear transformations, and eigenvalues.',
 '{"days": ["monday", "wednesday"], "time": "1:00 PM"}', 'archived', NOW() - INTERVAL '8 months');

-- Insert students for CS101
INSERT INTO students (id, class_id, first_name, last_name, email, student_id, created_at) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Emma', 'Wilson', 'emma.wilson@student.edu', 'STU001', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Liam', 'Brown', 'liam.brown@student.edu', 'STU002', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Olivia', 'Garcia', 'olivia.garcia@student.edu', 'STU003', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Noah', 'Martinez', 'noah.martinez@student.edu', 'STU004', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Ava', 'Rodriguez', 'ava.rodriguez@student.edu', 'STU005', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Ethan', 'Davis', 'ethan.davis@student.edu', 'STU006', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'Sophia', 'Lopez', 'sophia.lopez@student.edu', 'STU007', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'Mason', 'Gonzalez', 'mason.gonzalez@student.edu', 'STU008', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'Isabella', 'Wilson', 'isabella.wilson@student.edu', 'STU009', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'James', 'Anderson', 'james.anderson@student.edu', 'STU010', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'Mia', 'Thomas', 'mia.thomas@student.edu', 'STU011', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', 'Benjamin', 'Taylor', 'benjamin.taylor@student.edu', 'STU012', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', 'Charlotte', 'Moore', 'charlotte.moore@student.edu', 'STU013', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000001', 'Lucas', 'Jackson', 'lucas.jackson@student.edu', 'STU014', NOW() - INTERVAL '4 months'),
('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001', 'Amelia', 'Martin', 'amelia.martin@student.edu', 'STU015', NOW() - INTERVAL '4 months');

-- Insert students for CS201
INSERT INTO students (id, class_id, first_name, last_name, email, student_id, created_at) VALUES
('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000002', 'Oliver', 'Lee', 'oliver.lee@student.edu', 'STU016', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000002', 'Harper', 'Perez', 'harper.perez@student.edu', 'STU017', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000002', 'Elijah', 'White', 'elijah.white@student.edu', 'STU018', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000002', 'Evelyn', 'Harris', 'evelyn.harris@student.edu', 'STU019', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000002', 'William', 'Sanchez', 'william.sanchez@student.edu', 'STU020', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000002', 'Abigail', 'Clark', 'abigail.clark@student.edu', 'STU021', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000002', 'Alexander', 'Ramirez', 'alexander.ramirez@student.edu', 'STU022', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000002', 'Emily', 'Lewis', 'emily.lewis@student.edu', 'STU023', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000002', 'Daniel', 'Robinson', 'daniel.robinson@student.edu', 'STU024', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000002', 'Elizabeth', 'Walker', 'elizabeth.walker@student.edu', 'STU025', NOW() - INTERVAL '3 months');

-- Insert students for Calculus I
INSERT INTO students (id, class_id, first_name, last_name, email, student_id, created_at) VALUES
('20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000003', 'Matthew', 'Young', 'matthew.young@student.edu', 'STU026', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000003', 'Sofia', 'Allen', 'sofia.allen@student.edu', 'STU027', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000003', 'David', 'King', 'david.king@student.edu', 'STU028', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000003', 'Avery', 'Wright', 'avery.wright@student.edu', 'STU029', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000003', 'Joseph', 'Scott', 'joseph.scott@student.edu', 'STU030', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000003', 'Ella', 'Green', 'ella.green@student.edu', 'STU031', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000003', 'Samuel', 'Baker', 'samuel.baker@student.edu', 'STU032', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000003', 'Scarlett', 'Adams', 'scarlett.adams@student.edu', 'STU033', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000034', '10000000-0000-0000-0000-000000000003', 'Henry', 'Nelson', 'henry.nelson@student.edu', 'STU034', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000035', '10000000-0000-0000-0000-000000000003', 'Victoria', 'Carter', 'victoria.carter@student.edu', 'STU035', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000036', '10000000-0000-0000-0000-000000000003', 'Sebastian', 'Mitchell', 'sebastian.mitchell@student.edu', 'STU036', NOW() - INTERVAL '3 months'),
('20000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000003', 'Grace', 'Perez', 'grace.perez@student.edu', 'STU037', NOW() - INTERVAL '3 months');

-- Insert students for English Composition
INSERT INTO students (id, class_id, first_name, last_name, email, student_id, created_at) VALUES
('20000000-0000-0000-0000-000000000038', '10000000-0000-0000-0000-000000000004', 'Jackson', 'Roberts', 'jackson.roberts@student.edu', 'STU038', NOW() - INTERVAL '2 months'),
('20000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000004', 'Chloe', 'Turner', 'chloe.turner@student.edu', 'STU039', NOW() - INTERVAL '2 months'),
('20000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000004', 'Jack', 'Phillips', 'jack.phillips@student.edu', 'STU040', NOW() - INTERVAL '2 months'),
('20000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000004', 'Lily', 'Campbell', 'lily.campbell@student.edu', 'STU041', NOW() - INTERVAL '2 months'),
('20000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000004', 'Owen', 'Parker', 'owen.parker@student.edu', 'STU042', NOW() - INTERVAL '2 months'),
('20000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000004', 'Zoe', 'Evans', 'zoe.evans@student.edu', 'STU043', NOW() - INTERVAL '2 months'),
('20000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000004', 'Luke', 'Edwards', 'luke.edwards@student.edu', 'STU044', NOW() - INTERVAL '2 months'),
('20000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000004', 'Hannah', 'Collins', 'hannah.collins@student.edu', 'STU045', NOW() - INTERVAL '2 months');

-- Insert sessions for CS101 (some active, some ended)
INSERT INTO sessions (id, class_id, title, meeting_link, started_at, ended_at, status, created_at) VALUES
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 
 'Week 1: Introduction to Python', 'https://meet.google.com/abc-defg-hij',
 NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days' + INTERVAL '50 minutes', 'ended', NOW() - INTERVAL '14 days'),

('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
 'Week 2: Variables and Data Types', 'https://meet.google.com/abc-defg-hij',
 NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days' + INTERVAL '50 minutes', 'ended', NOW() - INTERVAL '12 days'),

('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
 'Week 3: Control Flow', 'https://meet.google.com/abc-defg-hij',
 NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '50 minutes', 'ended', NOW() - INTERVAL '10 days'),

('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001',
 'Week 4: Functions and Modules', 'https://meet.google.com/abc-defg-hij',
 NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '50 minutes', 'ended', NOW() - INTERVAL '7 days'),

('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001',
 'Week 5: Data Structures - Lists', 'https://meet.google.com/abc-defg-hij',
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '50 minutes', 'ended', NOW() - INTERVAL '5 days'),

('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001',
 'Week 6: Data Structures - Dictionaries', 'https://meet.google.com/abc-defg-hij',
 NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '50 minutes', 'ended', NOW() - INTERVAL '3 days');

-- Insert sessions for CS201
INSERT INTO sessions (id, class_id, title, meeting_link, started_at, ended_at, status, created_at) VALUES
('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002',
 'Lecture 1: Algorithm Analysis', 'https://zoom.us/j/123456789',
 NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days' + INTERVAL '75 minutes', 'ended', NOW() - INTERVAL '8 days'),

('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002',
 'Lecture 2: Sorting Algorithms', 'https://zoom.us/j/123456789',
 NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '75 minutes', 'ended', NOW() - INTERVAL '6 days'),

('30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002',
 'Lecture 3: Binary Search Trees', 'https://zoom.us/j/123456789',
 NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '75 minutes', 'ended', NOW() - INTERVAL '4 days');

-- Insert sessions for Calculus I
INSERT INTO sessions (id, class_id, title, meeting_link, started_at, ended_at, status, created_at) VALUES
('30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003',
 'Lecture: Limits and Continuity', 'https://meet.google.com/xyz-abcd-efg',
 NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days' + INTERVAL '50 minutes', 'ended', NOW() - INTERVAL '9 days'),

('30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003',
 'Lecture: Derivatives', 'https://meet.google.com/xyz-abcd-efg',
 NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '50 minutes', 'ended', NOW() - INTERVAL '7 days'),

('30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003',
 'Lecture: Chain Rule', 'https://meet.google.com/xyz-abcd-efg',
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '50 minutes', 'ended', NOW() - INTERVAL '5 days'),

('30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003',
 'Lecture: Integration', 'https://meet.google.com/xyz-abcd-efg',
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '50 minutes', 'ended', NOW() - INTERVAL '2 days');

-- Insert participation logs (varied interactions for different students)
-- CS101 - Week 1 Session
INSERT INTO participation_logs (session_id, student_id, interaction_type, interaction_value, timestamp) VALUES
-- Highly active students
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'chat', 'Great introduction!', NOW() - INTERVAL '14 days' + INTERVAL '15 minutes'),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'mic_toggle', 'on', NOW() - INTERVAL '14 days' + INTERVAL '20 minutes'),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'chat', 'Can you explain that again?', NOW() - INTERVAL '14 days' + INTERVAL '35 minutes'),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'reaction', '👍', NOW() - INTERVAL '14 days' + INTERVAL '40 minutes'),

('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'mic_toggle', 'on', NOW() - INTERVAL '14 days' + INTERVAL '25 minutes'),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'chat', 'I have a question', NOW() - INTERVAL '14 days' + INTERVAL '30 minutes'),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'reaction', '✋', NOW() - INTERVAL '14 days' + INTERVAL '32 minutes'),

-- Moderately active students
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'chat', 'Thanks for the explanation', NOW() - INTERVAL '14 days' + INTERVAL '45 minutes'),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'reaction', '👏', NOW() - INTERVAL '14 days' + INTERVAL '48 minutes'),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'chat', 'This makes sense now', NOW() - INTERVAL '14 days' + INTERVAL '42 minutes'),

-- Low activity students (camera toggle only - indicating presence but minimal interaction)
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'camera_toggle', 'on', NOW() - INTERVAL '14 days' + INTERVAL '5 minutes'),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'camera_toggle', 'off', NOW() - INTERVAL '14 days' + INTERVAL '10 minutes');

-- CS101 - Week 2 Session (more varied participation)
INSERT INTO participation_logs (session_id, student_id, interaction_type, interaction_value, timestamp) VALUES
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'chat', 'I understand variables now!', NOW() - INTERVAL '12 days' + INTERVAL '20 minutes'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'mic_toggle', 'on', NOW() - INTERVAL '12 days' + INTERVAL '25 minutes'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'chat', 'What about string formatting?', NOW() - INTERVAL '12 days' + INTERVAL '30 minutes'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'reaction', '👍', NOW() - INTERVAL '12 days' + INTERVAL '35 minutes'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'mic_toggle', 'on', NOW() - INTERVAL '12 days' + INTERVAL '38 minutes'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', 'chat', 'Could you show an example?', NOW() - INTERVAL '12 days' + INTERVAL '40 minutes'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000008', 'chat', 'This is helpful', NOW() - INTERVAL '12 days' + INTERVAL '42 minutes'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000009', 'reaction', '❤️', NOW() - INTERVAL '12 days' + INTERVAL '45 minutes');

-- CS101 - Week 3 Session
INSERT INTO participation_logs (session_id, student_id, interaction_type, interaction_value, timestamp) VALUES
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'mic_toggle', 'on', NOW() - INTERVAL '10 days' + INTERVAL '15 minutes'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'chat', 'Loops are tricky', NOW() - INTERVAL '10 days' + INTERVAL '20 minutes'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'chat', 'Can you explain while loops?', NOW() - INTERVAL '10 days' + INTERVAL '25 minutes'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'mic_toggle', 'on', NOW() - INTERVAL '10 days' + INTERVAL '28 minutes'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', 'reaction', '🤔', NOW() - INTERVAL '10 days' + INTERVAL '30 minutes'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', 'chat', 'I get it now!', NOW() - INTERVAL '10 days' + INTERVAL '40 minutes'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000010', 'reaction', '✨', NOW() - INTERVAL '10 days' + INTERVAL '42 minutes'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000011', 'chat', 'Great examples', NOW() - INTERVAL '10 days' + INTERVAL '45 minutes');

-- CS201 - Lecture 1 (Advanced class - more technical discussions)
INSERT INTO participation_logs (session_id, student_id, interaction_type, interaction_value, timestamp) VALUES
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000016', 'chat', 'Is this O(n log n)?', NOW() - INTERVAL '8 days' + INTERVAL '20 minutes'),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000016', 'mic_toggle', 'on', NOW() - INTERVAL '8 days' + INTERVAL '30 minutes'),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000017', 'chat', 'What about space complexity?', NOW() - INTERVAL '8 days' + INTERVAL '35 minutes'),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000018', 'mic_toggle', 'on', NOW() - INTERVAL '8 days' + INTERVAL '40 minutes'),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000019', 'chat', 'Can you compare quicksort to mergesort?', NOW() - INTERVAL '8 days' + INTERVAL '50 minutes'),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000020', 'reaction', '👍', NOW() - INTERVAL '8 days' + INTERVAL '55 minutes');

-- Calculus - Lecture 1
INSERT INTO participation_logs (session_id, student_id, interaction_type, interaction_value, timestamp) VALUES
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000026', 'mic_toggle', 'on', NOW() - INTERVAL '9 days' + INTERVAL '20 minutes'),
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000027', 'chat', 'Can you explain epsilon-delta definition?', NOW() - INTERVAL '9 days' + INTERVAL '25 minutes'),
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000028', 'reaction', '🤯', NOW() - INTERVAL '9 days' + INTERVAL '30 minutes'),
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000029', 'chat', 'This is confusing', NOW() - INTERVAL '9 days' + INTERVAL '32 minutes'),
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000030', 'mic_toggle', 'on', NOW() - INTERVAL '9 days' + INTERVAL '40 minutes'),
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000031', 'chat', 'Thanks for clarifying', NOW() - INTERVAL '9 days' + INTERVAL '45 minutes');

-- Insert session links
INSERT INTO session_links (class_id, link_url, link_type, label, is_primary) VALUES
('10000000-0000-0000-0000-000000000001', 'https://meet.google.com/abc-defg-hij', 'meet', 'CS101 Main Meeting Room', true),
('10000000-0000-0000-0000-000000000001', 'https://meet.google.com/backup-room-123', 'meet', 'CS101 Backup Room', false),

('10000000-0000-0000-0000-000000000002', 'https://zoom.us/j/123456789', 'zoom', 'CS201 Lecture Hall', true),
('10000000-0000-0000-0000-000000000002', 'https://zoom.us/j/987654321', 'zoom', 'CS201 Office Hours', false),

('10000000-0000-0000-0000-000000000003', 'https://meet.google.com/xyz-abcd-efg', 'meet', 'Calculus I Classroom', true),

('10000000-0000-0000-0000-000000000004', 'https://teams.microsoft.com/l/meetup-join/19%3ameeting', 'teams', 'English Composition', true);

-- Insert exempted accounts (TAs, instructors, etc.)
INSERT INTO exempted_accounts (class_id, account_identifier, reason) VALUES
('10000000-0000-0000-0000-000000000001', 'ta.john@university.edu', 'Teaching Assistant'),
('10000000-0000-0000-0000-000000000001', 'john.doe@university.edu', 'Instructor'),
('10000000-0000-0000-0000-000000000002', 'ta.sarah@university.edu', 'Teaching Assistant'),
('10000000-0000-0000-0000-000000000003', 'grader.mike@university.edu', 'Grader');

-- Insert student tags
INSERT INTO student_tags (id, class_id, tag_name, tag_color) VALUES
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Needs Help', '#EF4444'),
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Highly Engaged', '#10B981'),
('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Group Leader', '#8B5CF6'),
('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Advanced', '#F59E0B'),
('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'At Risk', '#EF4444');

-- Insert student tag assignments
INSERT INTO student_tag_assignments (student_id, tag_id) VALUES
('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002'), -- Emma - Highly Engaged
('20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002'), -- Liam - Highly Engaged
('20000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000001'), -- Ethan - Needs Help
('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003'), -- Emma - Group Leader
('20000000-0000-0000-0000-000000000016', '40000000-0000-0000-0000-000000000004'), -- Oliver - Advanced
('20000000-0000-0000-0000-000000000026', '40000000-0000-0000-0000-000000000005'); -- Matthew - At Risk

-- Insert student notes
INSERT INTO student_notes (student_id, note_text, created_by, created_at) VALUES
('20000000-0000-0000-0000-000000000001', 'Excellent participation in class discussions. Shows strong understanding of concepts.', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', NOW() - INTERVAL '7 days'),
('20000000-0000-0000-0000-000000000001', 'Led group discussion on recursion. Great leadership skills.', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', NOW() - INTERVAL '3 days'),
('20000000-0000-0000-0000-000000000006', 'Struggling with loop concepts. Recommended tutoring sessions.', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', NOW() - INTERVAL '5 days'),
('20000000-0000-0000-0000-000000000006', 'Showed improvement after extra practice. Keep monitoring.', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', NOW() - INTERVAL '2 days'),
('20000000-0000-0000-0000-000000000026', 'Missed last quiz. Need to follow up on calculus fundamentals.', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', NOW() - INTERVAL '4 days');

-- Insert notifications
INSERT INTO notifications (user_id, type, title, message, action_url, read, created_at) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'session_ended', 'Session Ended', 'Your session "Week 6: Data Structures - Dictionaries" has ended.', '/sessions/30000000-0000-0000-0000-000000000006', false, NOW() - INTERVAL '3 days'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'low_participation', 'Low Participation Alert', '3 students had minimal participation in the last session.', '/classes/10000000-0000-0000-0000-000000000001/analytics', false, NOW() - INTERVAL '3 days'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'session_ended', 'Session Ended', 'Your session "Lecture 3: Binary Search Trees" has ended with 10 participants.', '/sessions/30000000-0000-0000-0000-000000000009', true, NOW() - INTERVAL '4 days'),
('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'session_ended', 'Session Ended', 'Your session "Lecture: Integration" has ended.', '/sessions/30000000-0000-0000-0000-000000000013', false, NOW() - INTERVAL '2 days');

-- Seed data complete
-- Note: The seed-database.js script will display a summary after successful insertion
