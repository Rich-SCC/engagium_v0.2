# Engagium - Student Engagement Tracking System

Engagium is a professor-centered web application designed to monitor, log, and analyze student engagement during synchronous online classes conducted via Zoom or Google Meet.

## Features

### Phase 1 MVP (10% Complete)
- ✅ Instructor authentication and user management
- ✅ Class management with student rosters
- ✅ Session creation and lifecycle management
- ✅ Manual participation logging
- ✅ Real-time dashboard with WebSocket updates
- ✅ CSV student import with flexible format detection
- ✅ Session statistics and analytics

### Future Phases
- 🔄 Zoom API integration
- 🔄 Google Meet Chrome extension
- 🔄 Automated participation capture
- 🔄 Advanced engagement scoring
- 🔄 Predictive analytics
- 🔄 Admin dashboard

## Tech Stack

### Backend
- **Node.js** with Express framework
- **PostgreSQL** database with Docker
- **JWT** authentication
- **Socket.io** for real-time features
- **Multer** for file uploads (CSV import)

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **Axios** for API communication
- **Socket.io Client** for real-time updates

### Database
- **PostgreSQL** with UUID primary keys
- **JSONB** for flexible metadata storage
- **Proper indexing** for performance

## Project Structure

```
engagium_v0.2/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # API and WebSocket services
│   │   ├── utils/          # Helper functions
│   │   ├── contexts/       # React contexts for state
│   │   └── styles/         # Tailwind CSS and custom styles
│   └── package.json
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   ├── config/         # Configuration files
│   │   └── socket/         # Socket.io handlers
│   └── package.json
├── database/                 # PostgreSQL setup and migrations
│   ├── schema.sql          # Initial database schema
│   └── docker-compose.yml  # PostgreSQL container setup
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (local installation or Docker)
- npm or yarn

### Option A: Quick Setup with Docker (Recommended for Beginners)

#### 1. Clone and Setup
```bash
git clone <repository-url>
cd engagium_v0.2
```

#### 2. Start Database
```bash
cd database
docker-compose up -d
```
This will start PostgreSQL on port 5432 with the initial schema.

#### 3. Install Dependencies & Start
```bash
# Backend
cd ../backend
npm install
npm run dev

# Frontend (in new terminal)
cd ../frontend
npm install
npm run dev
```

### Option B: Setup with Test Data (Recommended for Development)

This option sets up a local PostgreSQL database and seeds it with realistic test data.

#### 1. Setup PostgreSQL Database
```bash
cd database

# Create database and user
psql -U postgres -f setup-local.sql

# Apply schema
psql -U engagium_user -d engagium -f schema.sql
```

#### 2. Seed with Test Data
```bash
# Install dependencies and seed database
npm install
npm run seed

# Verify the data
npm run verify
```

**OR use the automated setup script:**

```bash
# Windows
setup.bat

# macOS/Linux
chmod +x setup.sh
./setup.sh
```

This creates:
- 3 instructor accounts
- 5 classes with 45 students total
- 13 sessions with participation data
- Tags, notes, notifications, and more

See [database/SEEDING_GUIDE.md](database/SEEDING_GUIDE.md) for details.

#### 3. Configure Backend
```bash
cd ../backend
cp .env.example .env
# Update DATABASE_URL if needed
npm install
```

#### 4. Start Development Servers
```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## Test Accounts

### With Seeded Data (Option B)
- **Email**: john.doe@university.edu
- **Password**: Password123!
- **Classes**: CS101 (15 students), CS201 (10 students)

Other accounts: sarah.smith@university.edu, michael.johnson@university.edu

### Default Demo Account (Option A)
- **Email**: instructor@engagium.com
- **Password**: password123

Or create a new account through the registration page.

## API Documentation

### Authentication
- `POST /api/auth/register` - Create new instructor account
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Classes
- `GET /api/classes` - List all instructor classes
- `POST /api/classes` - Create new class
- `GET /api/classes/:id` - Get class details
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Students
- `GET /api/classes/:classId/students` - List class students
- `POST /api/classes/:classId/students` - Add student
- `PUT /api/classes/:classId/students/:studentId` - Update student
- `DELETE /api/classes/:classId/students/:studentId` - Remove student
- `POST /api/classes/:classId/students/import` - CSV import

### Sessions
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id/start` - Start session
- `PUT /api/sessions/:id/end` - End session

### Participation
- `GET /api/participation/sessions/:sessionId/logs` - Get participation logs
- `POST /api/participation/sessions/:sessionId/logs` - Add manual entry
- `GET /api/participation/sessions/:sessionId/summary` - Session summary

## Database Schema

### Core Tables
- **users** - Instructor accounts
- **classes** - Class information
- **students** - Student rosters
- **sessions** - Class sessions
- **participation_logs** - Engagement events

See `database/schema.sql` for complete schema definition.

## Environment Variables

### Backend (.env)
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=engagium
DB_USER=engagium_user
DB_PASSWORD=engagium_password
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## WebSocket Events

### Client -> Server
- `join:session` - Join a session room
- `leave:session` - Leave a session room
- `participation:update` - Send live updates

### Server -> Client
- `session:started` - Session started notification
- `session:ended` - Session ended notification
- `participation:added` - New participation event
- `user:joined` - User joined session
- `user:left` - User left session

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Code Style
- ESLint and Prettier configured
- Follow existing patterns
- Use Tailwind for styling
- React Query for data fetching

### Database Migrations
Current setup uses `database/schema.sql` for initial setup.
Future versions will include migration system.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue in the repository.

---

**Engagium** - Empowering instructors to understand and enhance student engagement in online learning environments.