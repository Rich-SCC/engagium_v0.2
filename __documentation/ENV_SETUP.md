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

## Secrets Configuration

This section explains how to manage Engagium runtime secrets safely alongside your environment variables.

### Required Secrets

Create these files in local `.secrets/`:

- `db_password`
- `jwt_secret`
- `jwt_refresh_secret`
- `session_secret`
- `smtp_user`
- `smtp_pass`

Each file must contain only the raw value, with no key names and no quotes.

### Generate Local Secrets

Use the helper script:

```bash
./backend/scripts/generate-local-secrets.sh
```

Then verify files exist:

```bash
ls -la .secrets/
```

### Manual Secret Creation

If you need to create values manually:

- `jwt_secret`: at least 32 random characters
- `jwt_refresh_secret`: at least 32 random characters and different from jwt_secret
- `session_secret`: at least 16 random characters
- `db_password`: strong random password
- `smtp_user` and `smtp_pass`: valid SMTP credentials

### Docker Compose Secret Wiring

Secrets are injected using `_FILE` environment variables and mounted at `/run/secrets/*`.

Examples used by backend and db:

- `DB_PASSWORD_FILE=/run/secrets/db_password`
- `JWT_SECRET_FILE=/run/secrets/jwt_secret`
- `JWT_REFRESH_SECRET_FILE=/run/secrets/jwt_refresh_secret`
- `SESSION_SECRET_FILE=/run/secrets/session_secret`
- `SMTP_USER_FILE=/run/secrets/smtp_user`
- `SMTP_PASS_FILE=/run/secrets/smtp_pass`

## Security Rules & Important Notes

- **Never commit `.secrets/` contents.**
- **No plain text secrets in production:** Do not place real secrets in `backend/.env` for production. Keep them in Docker secret files and reference with `_FILE` vars.
- Rotate secrets when credentials are exposed or reused.
- Keep `jwt_secret` and `jwt_refresh_secret` distinct.
- Use different secret values per environment.
- Confirm effective runtime values from container env when validating deployments.

## Quick Validation

```bash
# confirm secrets are not placeholders
wc -c .secrets/jwt_secret .secrets/jwt_refresh_secret .secrets/session_secret
sha256sum .secrets/jwt_secret .secrets/jwt_refresh_secret
```

Backend should report healthy after startup:

```bash
curl -s http://localhost:3001/health
```
