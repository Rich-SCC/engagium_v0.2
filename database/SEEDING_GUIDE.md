# Database Seeding Quick Reference

## Quick Start (Fastest Method)

```bash
# 1. Navigate to database folder
cd database

# 2. Install dependencies
npm install

# 3. Make sure your backend/.env has DATABASE_URL configured
# Example: DATABASE_URL=postgresql://engagium_user:engagium_password@localhost:5432/engagium

# 4. Run the seeding script
npm run seed
```

## What Gets Created

### 👥 Users (3 Instructors)
- `john.doe@university.edu` - Has 2 classes (CS101 & CS201)
- `sarah.smith@university.edu` - Has 2 classes (Calculus I & Linear Algebra)
- `michael.johnson@university.edu` - Has 1 class (English Composition)

**Password for all users:** `Password123!`

### 📚 Classes (5)
1. **Introduction to Computer Science** (CS101-A) - 15 students, 6 sessions
2. **Data Structures and Algorithms** (CS201-B) - 10 students, 3 sessions
3. **Calculus I** (MATH101-C) - 12 students, 4 sessions
4. **English Composition** (ENG101-D) - 8 students
5. **Linear Algebra** (MATH201-E) - Archived class

### 🎓 Students (45 total)
Diverse names with realistic student IDs and emails across all classes.

### 📅 Sessions (13)
All sessions are ended with:
- Realistic timestamps (last 14 days)
- Meeting links (Google Meet, Zoom, Teams)
- Various durations (50-75 minutes)

### 💬 Participation Data
- ~50 interaction logs across sessions
- Mix of: chat messages, mic toggles, camera toggles, reactions
- Varies by student (highly engaged, moderately active, low activity)

### 🏷️ Student Tags (5)
- "Needs Help" (Red)
- "Highly Engaged" (Green)
- "Group Leader" (Purple)
- "Advanced" (Orange)
- "At Risk" (Red)

### 📝 Student Notes (5)
- Performance observations
- Recommendations
- Progress updates

### 🔔 Notifications (4)
- Session ended alerts
- Low participation warnings

### 🔗 Session Links (6)
Multiple meeting links per class with primary/backup designations.

### 🚫 Exempted Accounts (4)
TAs, instructors, and graders excluded from participation tracking.

## Testing Scenarios

### Scenario 1: High Engagement Class
**Login as:** john.doe@university.edu  
**View:** Introduction to Computer Science (CS101-A)  
**What to see:** Multiple sessions with varied participation levels, active students, tags, notes

### Scenario 2: Advanced Students
**Login as:** john.doe@university.edu  
**View:** Data Structures and Algorithms (CS201-B)  
**What to see:** More technical discussions, fewer but more engaged students

### Scenario 3: Large Lecture
**Login as:** sarah.smith@university.edu  
**View:** Calculus I (MATH101-C)  
**What to see:** Larger class size, mix of engagement levels, at-risk students

### Scenario 4: Notifications
**Login as:** any instructor  
**What to see:** System notifications about ended sessions and participation alerts

## Resetting Data

To clear and re-seed the database:

```bash
# Option 1: Using the seed script (clears data first)
npm run seed

# Option 2: Manually reset
psql -U engagium_user -d engagium -c "TRUNCATE TABLE notifications, student_notes, student_tag_assignments, student_tags, exempted_accounts, participation_logs, session_links, sessions, students, classes, users CASCADE;"
npm run seed
```

## Customization

To modify the seed data:

1. Edit `database/seed-data.sql`
2. Change student names, class details, participation logs, etc.
3. Run: `npm run seed`

## Troubleshooting

### "Cannot find module 'bcrypt'"
```bash
npm install
```

### "Connection refused" or database errors
1. Check PostgreSQL is running
2. Verify DATABASE_URL in backend/.env
3. Test connection: `psql -U engagium_user -d engagium`

### "Relation already exists"
The seed script automatically truncates existing data. If you get errors:
```bash
psql -U engagium_user -d engagium -f schema.sql
npm run seed
```

### Wrong password hashes
The script automatically generates proper bcrypt hashes. If passwords don't work:
1. Verify backend is using bcrypt with 10 rounds
2. Check the User model's password comparison logic
3. Re-run: `npm run seed`

## Data Overview

```
Users (Instructors)
├── John Doe
│   ├── CS101 (15 students, 6 sessions)
│   └── CS201 (10 students, 3 sessions)
├── Sarah Smith
│   ├── Calculus I (12 students, 4 sessions)
│   └── Linear Algebra (archived)
└── Michael Johnson
    └── English Composition (8 students)

Total: 45 students, 13 sessions, ~50 participation events
```

## Next Steps After Seeding

1. **Start Backend:**
   ```bash
   cd ../backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd ../frontend
   npm run dev
   ```

3. **Login:** Use any of the test instructor accounts

4. **Explore:**
   - View classes and students
   - Check session analytics
   - Review participation data
   - Test tagging and notes features
   - View notifications

## Production Warning

⚠️ **This seed data is for DEVELOPMENT ONLY!**

- Contains weak passwords
- Uses predictable test data
- Not suitable for production environments

For production, use proper user registration, strong passwords, and real data.
