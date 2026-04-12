# Environment Setup

This guide documents backend runtime environment configuration for local and production use.

## Core Variables

Server:

- PORT (default: 3001)
- NODE_ENV (development or production)
- CORS_ORIGIN (comma-separated origins)
- FRONTEND_URL

JWT timing:

- JWT_EXPIRES_IN (default: 15m)
- JWT_REFRESH_EXPIRES_IN (default: 7d)

SMTP config:

- SMTP_HOST
- SMTP_PORT
- SMTP_SECURE
- EMAIL_FROM_NAME

## Production Tuning Variables

Database pool:

- DB_POOL_MAX
- DB_IDLE_TIMEOUT_MS
- DB_CONNECTION_TIMEOUT_MS

Rate limiting:

- RATE_LIMIT_WINDOW_MS
- RATE_LIMIT_MAX

## Local Development

Use the non-secret example block in this document as your baseline config.

If running Docker Compose, prefer secret files in .secrets/ and _FILE wiring instead of plain env secrets.

## Production

Use production values from this guide and Docker secret file mounts.

Recommended baseline:

- NODE_ENV=production
- DB_POOL_MAX=40
- DB_IDLE_TIMEOUT_MS=30000
- DB_CONNECTION_TIMEOUT_MS=3000
- RATE_LIMIT_WINDOW_MS=900000
- RATE_LIMIT_MAX=600

## Example Non-Secret Block

```bash
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://engagium.app
FRONTEND_URL=https://engagium.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_FROM_NAME=Engagium
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
DB_POOL_MAX=40
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=600
```

## Important Notes

- Do not place real secrets in backend/.env for production.
- Keep secrets in Docker secret files and reference with _FILE vars.
- Confirm effective runtime values from container env when validating deployments.
