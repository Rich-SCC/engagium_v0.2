# Engagium Documentation

This folder contains comprehensive technical documentation for the Engagium platform.

## Core Documentation

### [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
High-level overview of Engagium's system design, including:
- Component architecture (frontend, backend, database)
- API design and Socket.io real-time communication
- Authentication and authorization flows
- Session and participation tracking architecture

### [SYSTEM_FRAMEWORK_FULL.md](./SYSTEM_FRAMEWORK_FULL.md)
Complete technical specification covering:
- Detailed module structure and dependencies
- Data models and database schema
- API endpoints and request/response formats
- Error handling and logging strategies
- Performance considerations and optimization

## Thesis Documentation

See [_for thesis/](_for%20thesis/) for research-related documentation including:
- Research specifications and methodology
- Implementation notes for thesis requirements
- Performance metrics and validation results
- Supporting materials for academic presentation

## Deployment and Operations

See [FIXES/](./FIXES/) for:
- Bug reports and resolution tracking
- Known issues and workarounds
- Production deployment notes and troubleshooting guides

## Environment and Secrets

- [ENV_SETUP.md](./ENV_SETUP.md) - Runtime environment variables and production tuning
- [SECRETS_SETUP.md](./SECRETS_SETUP.md) - Secret files, Docker secret wiring, and validation

## Quick Reference

**Key Files to Review:**
1. Start with [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) for the big picture
2. Read [SYSTEM_FRAMEWORK_FULL.md](./SYSTEM_FRAMEWORK_FULL.md) for technical details
3. Check [../PRODUCTION_READINESS_CHECKLIST.md](../PRODUCTION_READINESS_CHECKLIST.md) for deployment readiness

**For Development:**
- See root [README.md](../README.md) for quick start guide
- Backend environment: [ENV_SETUP.md](./ENV_SETUP.md)
- Secret files: [SECRETS_SETUP.md](./SECRETS_SETUP.md)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│  - Dashboard, sessions, analytics, class management        │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
                     ↓
┌─────────────────────────────────────────────────────────────┐
│               Backend API (Node.js + Express)               │
│  - Authentication, class/session management                 │
│  - Real-time updates via Socket.io                          │
│  - Email notifications                                      │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL
                     ↓
         ┌───────────────────────┐
         │   PostgreSQL 15       │
         │  User, Class, Session │
         │  Participation Data   │
         └───────────────────────┘

Extension:
  Browser API → Meeting Platform Detection → Backend Webhooks
  (Zoom/Google Meet) → Session Tracking → Participation Events
```

## Contact & Support

For questions about the architecture or implementation, refer to the thesis documentation in `_for thesis/` or contact the development team.
