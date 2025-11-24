-- Engagium Local PostgreSQL Setup Script
-- Run this as the postgres superuser: psql -U postgres -f setup-local.sql

-- Create database
CREATE DATABASE engagium;

-- Create user with password
-- IMPORTANT: Change this password to something secure!
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

-- Display success message
\echo 'Database setup complete!'
\echo 'Database: engagium'
\echo 'User: engagium_user'
\echo 'Password: engagium_password (CHANGE THIS!)'
\echo ''
\echo 'Next steps:'
\echo '1. Run: psql -U engagium_user -d engagium -f schema.sql'
\echo '2. Update your backend/.env file with:'
\echo '   DATABASE_URL=postgresql://engagium_user:engagium_password@localhost:5432/engagium'