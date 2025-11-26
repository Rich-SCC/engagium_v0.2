# Engagium Database Setup

This guide covers setting up the Engagium database using a local PostgreSQL installation.

## Prerequisites

- PostgreSQL 15 or higher installed on your local machine
- `psql` command-line tool (comes with PostgreSQL)

## Quick Start

### 1. Install PostgreSQL

If you don't have PostgreSQL installed:

**Windows:**

- Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- Run the installer and remember the password you set for the `postgres` user
- Add PostgreSQL's `bin` directory to your PATH (usually `C:\Program Files\PostgreSQL\15\bin`)

**macOS:**

```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database and User

Run the provided setup script:

```bash
# Navigate to the database directory
cd database

# Run the setup script
psql -U postgres -f setup-local.sql
```

You'll be prompted for your PostgreSQL superuser password.

**Alternative: Manual Setup**

If you prefer to set up manually:

```bash
# Connect to PostgreSQL
psql -U postgres

# Then run these commands:
CREATE DATABASE engagium;
CREATE USER engagium_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE engagium TO engagium_user;
\q
```

### 3. Initialize Schema

Apply the database schema:

```bash
psql -U engagium_user -d engagium -f schema.sql
```

### 4. Seed Test Data (Optional)

To populate the database with realistic test data for development:

**Option A: Using Node.js Script (Recommended)**

```bash
# Make sure you're in the database directory
cd database

# Make sure bcrypt and pg are installed
npm install bcrypt pg dotenv

# Run the seeding script
node seed-database.js
```

This will:
- Generate proper bcrypt password hashes
- Insert 3 instructors, 5 classes, 45 students
- Create 13 sessions with participation data
- Add tags, notes, and notifications

**Option B: Using SQL File Directly**

First, generate a password hash:

```bash
node generate-hash.js
```

Then copy the hash and replace it in `seed-data.sql`, and run:

```bash
psql -U engagium_user -d engagium -f seed-data.sql
```

**Test Login Credentials:**
- Email: `john.doe@university.edu`
- Password: `Password123!`

Other test accounts: `sarah.smith@university.edu` and `michael.johnson@university.edu` (same password)

### 5. Configure Backend Connection

Create a `.env` file in the `backend` directory (if it doesn't exist):

```bash
cd ../backend
cp .env.example .env
```

Update the `DATABASE_URL` in your `.env` file:

```env
DATABASE_URL=postgresql://engagium_user:your_secure_password@localhost:5432/engagium
```

Replace `your_secure_password` with the password you set for `engagium_user`.

## Connection String Format

The PostgreSQL connection string follows this format:

```
postgresql://[user]:[password]@[host]:[port]/[database]?[parameters]
```

**Example:**

```
postgresql://engagium_user:mypassword@localhost:5432/engagium
```

**With SSL (for production):**

```
postgresql://engagium_user:mypassword@localhost:5432/engagium?sslmode=require
```

## Verify Installation

Test your database connection:

```bash
# Using psql
psql -U engagium_user -d engagium -c "SELECT version();"

# Or check tables were created
psql -U engagium_user -d engagium -c "\dt"
```

You should see tables like `users`, `classes`, `students`, `sessions`, and `participation_logs`.

## Common Issues

### Authentication Failed

If you get "password authentication failed":

1. Check your password is correct
2. Verify `pg_hba.conf` allows local connections
3. On Windows, ensure you're using the correct user

### Database Already Exists

If the database already exists:

```bash
# Drop and recreate (WARNING: This deletes all data!)
psql -U postgres -c "DROP DATABASE IF EXISTS engagium;"
psql -U postgres -c "CREATE DATABASE engagium;"
```

### Permission Denied

If you get permission errors when creating the schema:

```bash
# Grant necessary permissions
psql -U postgres -d engagium -c "GRANT ALL ON SCHEMA public TO engagium_user;"
psql -U postgres -d engagium -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO engagium_user;"
```

## Database Management

### Backup Database

```bash
pg_dump -U engagium_user engagium > backup.sql
```

### Restore Database

```bash
psql -U engagium_user -d engagium < backup.sql
```

### Reset Database

```bash
# Drop all tables and recreate schema
psql -U engagium_user -d engagium -f schema.sql
```

## Development vs Production

### Development (Local)

```env
DATABASE_URL=postgresql://engagium_user:password@localhost:5432/engagium
```

### Production

- Use strong passwords
- Enable SSL connections
- Consider connection pooling
- Use environment-specific credentials

## Migration from Docker

If you were previously using Docker:

1. **Export data from Docker** (if needed):

   ```bash
   docker exec engagium-db pg_dump -U engagium_user engagium > docker-backup.sql
   ```

2. **Import to local database**:

   ```bash
   psql -U engagium_user -d engagium < docker-backup.sql
   ```

3. **Update your `.env`** file with the local connection string

4. **Stop Docker container**:
   ```bash
   docker-compose -f database/docker-compose.yml down
   ```

## Next Steps

After setting up the database:

1. Navigate to the backend directory: `cd ../backend`
2. Install dependencies: `npm install`
3. Run migrations (if using Prisma): `npx prisma migrate dev`
4. Start the backend: `npm run dev`

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Connection String Parameters](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
