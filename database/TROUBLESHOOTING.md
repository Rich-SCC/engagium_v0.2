# Database Seeding Troubleshooting Guide

## Common Issues and Solutions

### 1. Cannot Connect to Database

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

**Check PostgreSQL is Running:**
```bash
# Windows
pg_ctl status -D "C:\Program Files\PostgreSQL\15\data"

# macOS (Homebrew)
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

**Start PostgreSQL:**
```bash
# Windows
pg_ctl start -D "C:\Program Files\PostgreSQL\15\data"

# macOS (Homebrew)
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

**Verify Connection Manually:**
```bash
psql -U engagium_user -d engagium -c "SELECT version();"
```

### 2. Authentication Failed

**Error:**
```
password authentication failed for user "engagium_user"
```

**Solutions:**

**Check DATABASE_URL in backend/.env:**
```bash
cat ../backend/.env | grep DATABASE_URL
```

Should be:
```
DATABASE_URL=postgresql://engagium_user:engagium_password@localhost:5432/engagium
```

**Reset Password:**
```bash
psql -U postgres -c "ALTER USER engagium_user WITH PASSWORD 'engagium_password';"
```

**Check pg_hba.conf:**
The file should have an entry like:
```
local   all   engagium_user   md5
host    all   engagium_user   127.0.0.1/32   md5
```

### 3. Database Does Not Exist

**Error:**
```
database "engagium" does not exist
```

**Solution:**
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE engagium;"

# Grant permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE engagium TO engagium_user;"

# Apply schema
psql -U engagium_user -d engagium -f schema.sql
```

### 4. User Does Not Exist

**Error:**
```
role "engagium_user" does not exist
```

**Solution:**
```bash
# Run the setup script
psql -U postgres -f setup-local.sql

# Or manually:
psql -U postgres -c "CREATE USER engagium_user WITH PASSWORD 'engagium_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE engagium TO engagium_user;"
```

### 5. Permission Denied on Schema

**Error:**
```
permission denied for schema public
```

**Solution:**
```bash
psql -U postgres -d engagium << EOF
GRANT ALL ON SCHEMA public TO engagium_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO engagium_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO engagium_user;
EOF
```

### 6. Cannot Find Module 'bcrypt'

**Error:**
```
Error: Cannot find module 'bcrypt'
```

**Solution:**
```bash
cd database
npm install
```

If bcrypt fails to install (common on Windows):
```bash
npm install --build-from-source bcrypt
# or
npm install bcryptjs  # Alternative pure JS implementation
```

Then update seed-database.js to use bcryptjs:
```javascript
const bcrypt = require('bcryptjs');  // instead of 'bcrypt'
```

### 7. Foreign Key Constraint Violations

**Error:**
```
violates foreign key constraint
```

**Solution:**

The seed script truncates tables in the correct order. If you modified it:

```bash
# Manually truncate in correct order
psql -U engagium_user -d engagium << EOF
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
EOF

# Then re-run seed
npm run seed
```

### 8. UUID Extension Not Found

**Error:**
```
type "uuid" does not exist
```

**Solution:**
```bash
psql -U postgres -d engagium -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Then re-apply schema
psql -U engagium_user -d engagium -f schema.sql
```

### 9. Seed Data Already Exists

**Error:**
```
duplicate key value violates unique constraint
```

**Solution:**

The seed script should automatically truncate. If not:

```bash
# Option 1: Force re-seed
psql -U engagium_user -d engagium << EOF
TRUNCATE TABLE users CASCADE;
EOF
npm run seed

# Option 2: Drop and recreate everything
psql -U postgres -d engagium -f schema.sql
npm run seed
```

### 10. Wrong Password Hash

**Problem:** Can't login with test credentials after seeding.

**Solution:**

Verify the hash is correct:
```bash
# Generate a fresh hash
node database/generate-hash.js

# Compare with database
psql -U engagium_user -d engagium -c "SELECT email, password_hash FROM users LIMIT 1;"
```

The seed-database.js script should generate hashes automatically. If not working:

1. Check backend is using bcrypt (not something else)
2. Verify salt rounds match (should be 10)
3. Re-run the seed: `npm run seed`

### 11. Port Already in Use

**Error:**
```
Port 5432 is already in use
```

**Solutions:**

**Check what's using the port:**
```bash
# Windows
netstat -ano | findstr :5432

# macOS/Linux
lsof -i :5432
```

**If it's another PostgreSQL instance:**
- Use that instance instead
- Or change the port in DATABASE_URL
- Or stop the other instance

### 12. npm run seed Hangs

**Problem:** Script runs but never completes.

**Solutions:**

**Check for:**
1. Missing DATABASE_URL environment variable
2. PostgreSQL not responding
3. Network/firewall issues

**Debug:**
```bash
# Run with debugging
DEBUG=* npm run seed

# Or add console.log to seed-database.js
```

**Test connection separately:**
```bash
node -e "require('pg').Client({ connectionString: process.env.DATABASE_URL }).connect().then(() => console.log('OK')).catch(console.error)"
```

### 13. Windows Path Issues

**Error:**
```
Cannot find module '../backend/.env'
```

**Solution:**

Windows uses different path separators. The scripts should handle this, but if not:

Update seed-database.js:
```javascript
const path = require('path');
require('dotenv').config({ 
  path: path.join(__dirname, '..', 'backend', '.env') 
});
```

### 14. Schema Tables Already Exist

**Error:**
```
relation "users" already exists
```

**Solution:**

This is usually fine - the schema uses `IF NOT EXISTS`. But if you need fresh tables:

```bash
# Drop all tables and recreate
psql -U engagium_user -d engagium << EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO engagium_user;
EOF

# Reapply schema
psql -U engagium_user -d engagium -f schema.sql

# Seed
npm run seed
```

### 15. .env File Not Found

**Error:**
```
Error: .env file not found
```

**Solution:**
```bash
cd backend

# If .env.example exists
cp .env.example .env

# If not, create manually
cat > .env << EOF
DATABASE_URL=postgresql://engagium_user:engagium_password@localhost:5432/engagium
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
EOF
```

## Verification Checklist

After resolving issues, verify everything works:

```bash
# 1. Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# 2. Check database exists
psql -U postgres -c "\l" | grep engagium

# 3. Check user exists
psql -U postgres -c "\du" | grep engagium_user

# 4. Check can connect
psql -U engagium_user -d engagium -c "SELECT current_user;"

# 5. Check tables exist
psql -U engagium_user -d engagium -c "\dt"

# 6. Run seed
cd database
npm install
npm run seed

# 7. Verify data
npm run verify

# 8. Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@university.edu","password":"Password123!"}'
```

## Getting Help

### Check Logs

**PostgreSQL logs:**
```bash
# Windows
type "C:\Program Files\PostgreSQL\15\data\log\postgresql-*.log"

# macOS (Homebrew)
tail -f /usr/local/var/log/postgres.log

# Linux
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

**Node.js errors:**
The seed script prints detailed errors. Look for:
- Connection errors
- SQL syntax errors
- Permission issues

### Debug Mode

Run with more verbose output:
```bash
# PostgreSQL verbose
psql -U engagium_user -d engagium -a -f seed-data.sql

# Node.js debug
DEBUG=* npm run seed
```

### Clean Slate

If all else fails, start fresh:

```bash
# 1. Drop everything
psql -U postgres -c "DROP DATABASE IF EXISTS engagium;"
psql -U postgres -c "DROP USER IF EXISTS engagium_user;"

# 2. Recreate from scratch
psql -U postgres -f database/setup-local.sql
psql -U engagium_user -d engagium -f database/schema.sql

# 3. Seed
cd database
npm install
npm run seed
```

## Still Having Issues?

1. Check PostgreSQL version: `psql --version` (should be 15+)
2. Check Node.js version: `node --version` (should be 18+)
3. Verify backend/.env has correct DATABASE_URL
4. Check PostgreSQL is accepting connections on localhost:5432
5. Review the error message carefully - it usually tells you what's wrong
6. Check the documentation files in database/ folder

## Platform-Specific Notes

### Windows
- Make sure PostgreSQL bin directory is in PATH
- Use `setup.bat` instead of `setup.sh`
- May need to run Command Prompt as Administrator
- Firewall might block port 5432

### macOS
- If using Homebrew, PostgreSQL might be in a different location
- May need to use full path to psql
- Check with: `which psql`

### Linux
- PostgreSQL config in /etc/postgresql/
- May need sudo for some commands
- Check if PostgreSQL is enabled: `systemctl is-enabled postgresql`

### WSL (Windows Subsystem for Linux)
- PostgreSQL on Windows won't be accessible from WSL automatically
- Either install PostgreSQL in WSL or use Windows paths
- Networking between WSL and Windows can be tricky
