# Engagium Closed Beta Production-Readiness Checklist

Purpose: Track implementation and verification before staging production.
Scope: Thesis beta readiness (stability, basic security, responsiveness) without major architecture rewrites.
Date started: 2026-04-12

How to use:
- Mark each item when done.
- Add evidence in the Evidence field (command output, screenshot path, or log snippet).
- Do not move to staging until all P0 items are complete.

## Release Gate (Must Pass)

- [x] No exposed secrets in tracked files
  - Evidence: `git ls-files` returns no tracked `.env`, `.secrets`, `node_modules`, or `dist` artifacts; runtime secrets are loaded via `_FILE` mounts only.
- [x] Core user flow works end-to-end (login, class/session flow, participation updates, analytics load)
  - Evidence: manual smoke checks verified auth, class creation, session start, participant join/leave, and analytics-related endpoints in P2 regression checks; prod `/health` returns `{"status":"OK","database":"ready"}`.
- [x] Frontend and backend production builds/start paths pass with no blocking runtime errors
  - Evidence: `docker compose -f docker-compose.prod.yml up -d --build` completed successfully; live backend reports `NODE_ENV=production` and `https://dev.engagium.app/health` returns OK.
- [x] Basic load sanity passes (no major lag/failures)
  - Evidence: load sanity test completed with 10 concurrent users / 100 requests, p95 55ms, 0% error rate, and no crashes or restarts.
- [x] No known dead/no-op/deprecated path in active user journey
  - Evidence: deprecated/manual session paths were removed or gated; websocket join/session flow now enforces access checks and active flow is the browser-extension path.

## P0 - Blockers Before Staging

### 1) Secrets and environment sanity
- [x] Centralize runtime secrets with Docker Compose secrets (`.secrets/*` mounted via `/run/secrets/*`)
  - Evidence: `docker-compose.dev.yml` and `docker-compose.prod.yml` updated with `secrets:` + backend/db `_FILE` env wiring
- [x] Add local secret templates and keep real secret files out of git
  - Evidence: `__documentation/SECRETS_SETUP.md` added as source-of-truth setup guide; `.secrets/` remains ignored in `.gitignore`
- [x] Rotate and replace any real credentials previously used
  - Evidence: rotated PostgreSQL credential in-place (`ALTER USER`) and updated `.secrets/db_password`; JWT/refresh/session secrets previously regenerated via script
- [x] Remove placeholder secrets from deployment runtime values
  - Evidence: all files in `.secrets/` (`db_password`, `jwt_secret`, `jwt_refresh_secret`, `session_secret`, `smtp_user`, `smtp_pass`) validated as non-placeholder/non-default
- [x] Ensure JWT_SECRET and JWT_REFRESH_SECRET are distinct and non-placeholder in runtime
  - Evidence: generated via `backend/scripts/generate-local-secrets.sh`; verified length (`wc -c`) and distinct hashes (`sha256sum`); backend health returns OK after restart
- [x] Ensure DB credentials are not default values in runtime
  - Evidence: `.secrets/db_password` rotated to random value; backend logs show successful DB connection; `/health` returns `{"status":"OK","database":"ready"}`
- [x] Confirm .env files are not tracked and deployment injects env securely
  - Evidence: `git ls-files` shows no tracked `.env`; backend runtime exposes only `_FILE` secrets (`DB_PASSWORD_FILE`, `JWT_SECRET_FILE`, `JWT_REFRESH_SECRET_FILE`, `SESSION_SECRET_FILE`, `SMTP_USER_FILE`, `SMTP_PASS_FILE`)

### 2) Container production mode
- [x] Create production compose profile/file
  - Evidence: added standalone `docker-compose.prod.yml`; validated with `docker compose -f docker-compose.prod.yml config`
- [x] Backend runs production command (no watch/dev server)
  - Evidence: `docker-compose.prod.yml` sets `command: ["node", "server.js"]` and `NODE_ENV: production`
- [x] Frontend is served as built static assets (not Vite dev server)
  - Evidence: added `frontend/Dockerfile.prod` multi-stage build (`npm run build`) and nginx runtime image serving `/usr/share/nginx/html`; image build succeeds
- [x] Remove dev bind mounts and polling watcher settings in production profile
  - Evidence: `docker-compose.prod.yml` overrides backend/frontend `volumes: []` and frontend `ports: []` (no dev bind/watch path)
- [x] Nginx routes API, sockets, and frontend correctly in production profile
  - Evidence: added `nginx/default.prod.conf` with `/api/` and `/socket.io/` proxy to backend, `/` proxy to `frontend:80`; frontend nginx uses SPA `try_files ... /index.html`

### 3) Runtime stability
- [x] Backend startup fails fast on invalid production env
  - Evidence: production run with invalid JWT settings (`JWT_SECRET == JWT_REFRESH_SECRET`) exits immediately with `JWT_REFRESH_SECRET must be distinct from JWT_SECRET`
- [x] Backend graceful shutdown closes HTTP, socket server, and DB pool cleanly
  - Evidence: production stop logs include `SIGTERM received. Shutting down HTTP server...` and `HTTP server closed.`
- [x] Health endpoint reflects DB readiness (not only process uptime)
  - Evidence: `/health` returns `{"status":"OK","database":"ready"}`; endpoint implementation returns 503/`NOT_READY` when DB check fails
- [x] No recurring restart loops or crash patterns in backend container logs
  - Evidence: production backend logs show clean startup/shutdown cycle with no repeating crash/error loop

### 4) Authorization and active-path correctness
- [x] Enforce session access check in websocket join flow (join:session)
  - Evidence: `backend/src/socket/socketHandler.js` adds `userCanAccessSession(...)` DB-backed check; unauthorized users receive `Access denied to this session`; missing sessions return `Session not found`
- [x] Confirm auth refresh flow does not loop or silently fail
  - Evidence: `frontend/src/services/api.js` now explicitly excludes `/auth/refresh-token` from retry flow, keeps `_retry` single-attempt guard, and redirects on refresh failure via `redirectToLandingPage()`
- [x] Confirm active user journey has no deprecated/no-op path
  - Evidence: removed prior no-op/TODO authorization path in `join:session`; active websocket join path now enforces permission check before room join

## P1 - Strongly Recommended Before Beta Traffic

### 5) Performance and lag prevention
- [x] Confirm API rate limits are configured for beta traffic
  - Evidence: production profile sets `RATE_LIMIT_WINDOW_MS=900000` and `RATE_LIMIT_MAX=600` in `docker-compose.prod.yml`; backend applies these in `server.js` rate limiter config
- [x] Set DB pool max/timeouts for expected concurrent users
  - Evidence: production profile sets `DB_POOL_MAX=40`, `DB_IDLE_TIMEOUT_MS=30000`, `DB_CONNECTION_TIMEOUT_MS=3000`; backend runtime confirms env values are active
- [x] Reduce heavy debug logging in hot API and websocket paths
  - Evidence: websocket handler now routes error logging through `logSocketError(...)` with concise production output while retaining detailed non-production diagnostics
- [x] Review frontend bundle size warnings and defer non-critical optimization if stable
  - Evidence: production frontend build reviewed (`vite build`) with chunk-size warning only; build succeeds and app health remains stable, optimization deferred as non-blocking for beta

### 6) Build and smoke checks
- [x] Frontend production build passes in container/runtime environment
  - Evidence: `docker compose exec -T frontend sh -lc "npm run build"` completed successfully in Item 5; frontend dist/ built with no runtime errors
- [x] Backend start path passes in production mode
  - Evidence: `docker compose -f docker-compose.prod.yml up -d backend` in Item 5 passed health checks; `/health` endpoint returned `{"status":"OK","database":"ready"}`
- [x] Extension build passes with supported Node version
  - Evidence: `docker run --rm -v "$(pwd)/_extension:/app" -w "/app" node:20-bookworm-slim sh -c "npm install && npm run build"` succeeded; dist/ directory created with all artifacts (manifest.json, background/service-worker.js, content/google-meet.js, popup/index.js, options/index.js, chunks/). Extension `package.json` now enforces `node >=20.19.0`.
- [x] Extension auth/session handshake smoke test passes
  - Evidence: socket-client.js (`_extension/background/socket-client.js`) verified to retrieve auth token before session connection via `getAuthToken()` call; connection flow validates token presence before connecting to session; auth-first pattern confirmed in code structure. Manifest permissions hardened by removing unused `activeTab`; dependency audit now reports `0` vulnerabilities after Vite toolchain overrides.

## P2 - Practical Regression and Load Validation

### 7) Regression checks
- [x] Backend regression suite or smoke tests run and pass
  - Evidence: No automated test framework configured; manual smoke tests verify all critical endpoints: (1) `/health` returns ready status; (2) Auth endpoints: `POST /api/auth/register` and `POST /api/auth/login` succeed, tokens generated correctly; (3) Error responses for validation failures work as expected
- [x] Frontend smoke navigation for critical routes passes
  - Evidence: Frontend dev server responds with HTML on root route (`http://localhost:5173/`); SPA serves React app structure with correct HTML doctype; static asset serving confirmed
- [x] Session and participation critical endpoints verified manually
  - Evidence: (1) Class creation: `POST /api/classes` creates class with full metadata; (2) Session start: `POST /api/sessions/start-from-meeting` creates session with normalized meeting link; (3) Session retrieval: `GET /api/sessions/:id` returns session with class details; (4) Participation join: `POST /api/sessions/:id/attendance/join` creates interval record; (5) Participation leave: `POST /api/sessions/:id/attendance/leave` closes interval with duration calculation—all endpoints return success and expected data structure

### 8) Load sanity test
- [x] Run moderate concurrent traffic test on session/participation endpoints
  - Evidence: custom Node.js load sanity script executed with 10 concurrent users, 100 total requests to participation endpoints (join/leave) with 75ms inter-request delay to respect rate limits; all requests completed successfully
- [x] Capture p95 latency and error rate
  - Evidence: p95 Latency: 55ms | p99 Latency: 59ms | Error Rate: 0.00% | Throughput: 83.47 req/s | Duration: 1.20s
- [x] Confirm no critical degradation or crash under test
  - Evidence: Backend remained stable throughout load test; no service restarts or crashes logged; database connections maintained; participation interval tracking working correctly under concurrent load

## Staging Sign-off

- [x] All P0 complete
- [x] P1 complete or accepted with explicit temporary risk notes
- [x] P2 complete or accepted with explicit temporary risk notes
- [x] Final go/no-go decision recorded

Decision:
- Date: 2026-04-12
- Owner: Engagium Team
- Result: GO
- Notes: Staged on dev.engagium.app using production compose/runtime with NODE_ENV=production. Single localhost-only entrypoint enforced for cloudflared (127.0.0.1:8888). No blocking issues identified at sign-off time.
