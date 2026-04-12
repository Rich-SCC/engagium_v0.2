# Secrets Setup

This guide explains how to manage Engagium runtime secrets safely.

## Required Secrets

Create these files in local .secrets/:

- db_password
- jwt_secret
- jwt_refresh_secret
- session_secret
- smtp_user
- smtp_pass

Each file must contain only the raw value, with no key names and no quotes.

## Generate Local Secrets

Use the helper script:

```bash
./backend/scripts/generate-local-secrets.sh
```

Then verify files exist:

```bash
ls -la .secrets/
```

## Manual Secret Creation

If you need to create values manually:

- jwt_secret: at least 32 random characters
- jwt_refresh_secret: at least 32 random characters and different from jwt_secret
- session_secret: at least 16 random characters
- db_password: strong random password
- smtp_user and smtp_pass: valid SMTP credentials

## Docker Compose Secret Wiring

Secrets are injected using _FILE environment variables and mounted at /run/secrets/*.

Examples used by backend and db:

- DB_PASSWORD_FILE=/run/secrets/db_password
- JWT_SECRET_FILE=/run/secrets/jwt_secret
- JWT_REFRESH_SECRET_FILE=/run/secrets/jwt_refresh_secret
- SESSION_SECRET_FILE=/run/secrets/session_secret
- SMTP_USER_FILE=/run/secrets/smtp_user
- SMTP_PASS_FILE=/run/secrets/smtp_pass

## Security Rules

- Never commit .secrets/ contents.
- Rotate secrets when credentials are exposed or reused.
- Keep jwt_secret and jwt_refresh_secret distinct.
- Use different secret values per environment.

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
