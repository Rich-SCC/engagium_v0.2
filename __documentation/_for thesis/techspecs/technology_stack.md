# Technology Stack
## Engagium System - Current Stack and Versions

**Last Updated:** April 18, 2026  
**Source of truth:** `backend/package.json`, `frontend/package.json`, `_extension/package.json`

---

## 1. Backend Stack

| Layer | Technology | Version (Current) | Notes |
|------|------------|-------------------|------|
| Runtime | Node.js | >=20.19.0 | Enforced in engines |
| HTTP API | express | 4.22.1 | Core REST framework |
| Realtime | socket.io | ^4.8.3 | Live dashboard updates |
| Database driver | pg | ^8.8.0 | PostgreSQL access |
| Auth | jsonwebtoken | ^9.0.3 | Access/refresh JWT flows |
| Password hashing | bcryptjs via alias | npm:bcryptjs@^2.4.3 | Installed as `bcrypt` alias |
| Security | helmet | ^6.0.0 | Security headers |
| Rate limiting | express-rate-limit | ^6.7.0 | `/api/*` limiter |
| Uploads | multer | ^2.1.1 | CSV ingestion |
| CSV parser | csv-parser | ^3.0.0 | Student import parsing |
| Email | nodemailer | ^8.0.5 | Password reset emails |
| Env config | dotenv | ^16.0.0 | Runtime configuration |
| IDs | uuid | ^9.0.0 | UUID generation |

---

## 2. Frontend Stack

| Layer | Technology | Version (Current) | Notes |
|------|------------|-------------------|------|
| UI framework | react | ^18.2.0 | Dashboard app |
| Renderer | react-dom | ^18.2.0 | Browser rendering |
| Build tool | vite | ^7.3.2 | Dev/build |
| Router | react-router-dom | ^6.30.3 | Public + protected routes |
| Data fetching | @tanstack/react-query | ^4.24.0 | Server-state caching |
| Forms | react-hook-form | ^7.43.0 | Form state and validation |
| HTTP client | axios | ^1.15.0 | API requests |
| Realtime client | socket.io-client | ^4.8.1 | Live updates |
| Charts | recharts | ^3.5.1 | Analytics visualizations |
| Icons | @heroicons/react | ^2.0.18 | UI iconography |
| Zoom SDK | @zoom/appssdk | ^0.16.37 | Zoom bridge integration |
| Reports | jspdf / jspdf-autotable | ^4.2.1 / ^5.0.7 | PDF export features |

---

## 3. Extension Stack

| Layer | Technology | Version (Current) | Notes |
|------|------------|-------------------|------|
| Platform | Chrome Extension Manifest | v3 | Service worker model |
| UI runtime | react / react-dom | ^18.2.0 | Popup and options pages |
| Build tool | vite | ^7.3.2 | Extension bundling |
| Offline store | idb | ^7.1.1 | IndexedDB wrapper |
| Date utils | date-fns | ^2.30.0 | Date formatting |
| IDs | uuid | ^9.0.0 | Local identifiers |
| Chrome typings | @types/chrome | ^0.0.254 | Tooling support |

---

## 4. Database Stack

| Item | Technology |
|------|------------|
| Database engine | PostgreSQL |
| UUID support | `uuid-ossp` extension |
| Schema style | Migration-safe SQL with `IF NOT EXISTS` |
| Data integrity | Foreign keys, unique constraints, enum types |
| Performance | Indexed lookup fields and trigger-based `updated_at` maintenance |

---

## 5. Tooling and Operations

| Tooling | Current Use |
|--------|-------------|
| Docker Compose | Local and production service orchestration |
| VS Code | Primary development environment |
| Chrome DevTools | Extension debugging and DOM tracing |
| Postman / Thunder Client | Route and payload verification |
| Nginx configs | Frontend/backend reverse-proxy deployment paths |

---

## 6. Compatibility Baseline

| Component | Baseline |
|----------|----------|
| Node.js | 20.19+ |
| Chrome | Current stable (Manifest V3 support required) |
| PostgreSQL | Current schema compatible with modern 12+ environments |

---

## 7. Notes on Direction

- Extension scope is Google Meet only.
- Zoom support follows the Zoom Apps SDK bridge model in frontend services/routes.
- Shared backend APIs and schema power both meeting integrations.

