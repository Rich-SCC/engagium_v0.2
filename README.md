# Engagium - Student Engagement Tracking System

A professor-centered web application for tracking, logging, and analyzing student engagement during synchronous online classes (Zoom/Google Meet).

## Quick Start

**Prerequisites**: Docker, Docker Compose, Node.js 20+

```bash
# 1. Set up local secrets
mkdir -p .secrets
# Add required secret files listed in __documentation/SECRETS_SETUP.md

# 2. Start services
docker compose -f docker-compose.dev.yml up -d

# 3. Frontend available at http://localhost:8888
# 4. Backend API available at http://localhost:3001
```

## Features

- Real-time participation tracking in Zoom/Google Meet
- Student roster and class management
- Engagement analytics and trend analysis
- CSV import for bulk student data
- Live session monitoring with Socket.io
- Browser extension for seamless integration

## Architecture

- **Frontend**: React + Vite + Tailwind CSS  
- **Backend**: Node.js + Express + Socket.io  
- **Database**: PostgreSQL 15  
- **Infrastructure**: Docker Compose, Nginx reverse proxy  

## Documentation

- [System Architecture](__documentation/SYSTEM_ARCHITECTURE.md) - Core design overview
- [System Framework](__documentation/SYSTEM_FRAMEWORK_FULL.md) - Complete technical specification
- [For Thesis](__documentation/_for%20thesis/) - Research documentation
- [Production Readiness](./PRODUCTION_READINESS_CHECKLIST.md) - Beta deployment status

## Development

```bash
# Frontend development server
cd frontend
npm install
npm run dev

# Backend development server
cd backend
npm install
npm run dev
```

## Running Prod And Dev Simultaneously

Run the stacks with different Compose project names and different host ports.

1. Start production stack:
	NGINX_PORT=8888 docker compose -p engagium-prod -f docker-compose.prod.yml up -d

2. Start development stack on non-overlapping ports:
	DB_PORT=5433 BACKEND_PORT=3002 FRONTEND_PORT=5174 NGINX_PORT=8889 docker compose -p engagium-dev -f docker-compose.dev.yml up -d

3. Route hostnames at the edge proxy:
	engagium.app -> 127.0.0.1:8888
	dev.engagium.app -> 127.0.0.1:8889

4. Verify both stacks are up:
	docker compose -p engagium-prod -f docker-compose.prod.yml ps
	docker compose -p engagium-dev -f docker-compose.dev.yml ps

## Environment Setup

See [Environment Setup](__documentation/ENV_SETUP.md) and [Secrets Setup](__documentation/SECRETS_SETUP.md).
