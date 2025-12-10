# Engagium - Student Engagement Tracking System

Engagium is a professor-centered web application designed to monitor, log, and analyze student engagement during synchronous online classes conducted via Zoom or Google Meet.

## What is Engagium?

Engagium helps instructors:
- Track student participation in real-time during online classes
- Manage class rosters and session schedules
- Analyze engagement patterns and trends
- Import student data from CSV files
- Monitor attendance and participation metrics

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Real-time**: Socket.io for live updates

For detailed technical documentation, see the `__documentation` folder.

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
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd engagium_v0.2
```

2. **Setup the database**
```bash
cd database
docker-compose up -d
```

3. **Configure backend**
```bash
cd ../backend
cp .env.example .env
# Edit .env with your database credentials
npm install
```

4. **Configure frontend**
```bash
cd ../frontend
npm install
```

5. **Start the application**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### First Time Setup

Create your instructor account through the registration page, then:
1. Create a class
2. Add students (manually or via CSV import)
3. Create a session
4. Start tracking participation!

### Test Data (Optional)

To populate the database with sample data for development:
```bash
cd database
npm install
npm run seed
```

This creates sample instructors, classes, students, and sessions for testing.

## Documentation

For detailed information about the system, see the `__documentation` folder:

- **System Architecture**: Technical design and component overview
- **Authentication**: User management and security implementation
- **Classes & Students**: Managing rosters and student data
- **Sessions**: Session lifecycle and management
- **Participation**: Tracking and logging student engagement
- **Extension**: Chrome extension for Google Meet integration
- **Testing**: Test plans and checklists

## Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=engagium
DB_USER=engagium_user
DB_PASSWORD=engagium_password
JWT_SECRET=your-secret-key-here
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## Development

```bash
# Run tests
npm test

# Check code style
npm run lint

# Format code
npm run format
```## Project Structure

```
engagium_v0.2/
├── frontend/          # React application
├── backend/           # Node.js API server
├── database/          # PostgreSQL schema and setup
├── _extension/        # Chrome extension for Google Meet
└── __documentation/   # Technical documentation
```

## Support

For questions or detailed documentation, see the `__documentation` folder or open an issue in the repository.

---

**Engagium** - Empowering instructors to understand and enhance student engagement in online learning environments.