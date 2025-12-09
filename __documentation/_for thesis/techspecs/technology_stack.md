# Technology Stack
## Engagium System - Chapter 3.3.4 Reference

This document details the complete technology stack used in the Engagium system, organized by architectural layer.

---

## Overview

| Layer | Primary Technologies |
|-------|---------------------|
| **Frontend** | React 18.2, Vite 6.1, Tailwind CSS 3.3 |
| **Backend** | Node.js, Express 4.18, Socket.io 4.6 |
| **Database** | PostgreSQL with pg 8.8 driver |
| **Extension** | Chrome Manifest V3, React 18.2, Vite 7.2 |

---

## 1. Backend Technologies

The backend serves as the central API and real-time communication hub.

### Core Runtime & Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18.x+ | JavaScript runtime environment |
| **Express.js** | 4.18.0 | REST API web framework |
| **Socket.io** | 4.6.0 | Real-time bidirectional WebSocket communication |

### Security & Authentication

| Technology | Version | Purpose |
|------------|---------|---------|
| **JSON Web Tokens (jsonwebtoken)** | 9.0.0 | Token-based authentication (access + refresh tokens) |
| **bcrypt** | 5.1.0 | Password hashing with salt rounds |
| **Helmet** | 6.0.0 | HTTP security headers (XSS, CSRF protection) |
| **express-rate-limit** | 6.7.0 | API rate limiting to prevent abuse |
| **CORS** | 2.8.5 | Cross-Origin Resource Sharing configuration |

### Database & Data Handling

| Technology | Version | Purpose |
|------------|---------|---------|
| **pg (node-postgres)** | 8.8.0 | PostgreSQL database driver |
| **Multer** | 2.0.2 | Multipart form data handling (CSV uploads) |
| **csv-parser** | 3.0.0 | CSV file parsing for student imports |
| **uuid** | 9.0.0 | UUID generation for database records |

### Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **Nodemailer** | 7.0.10 | Email sending (password reset functionality) |
| **dotenv** | 16.0.0 | Environment variable management |
| **nodemon** | 3.0.0 | Development auto-restart (dev dependency) |

---

## 2. Frontend Technologies

The frontend provides the instructor dashboard and analytics interface.

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | Component-based UI library |
| **React DOM** | 18.2.0 | React rendering for web browsers |
| **Vite** | 6.1.0 | Fast build tool and development server |

### Routing & State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Router DOM** | 6.8.0 | Client-side routing and navigation |
| **React Context API** | (built-in) | Global state management (Auth, WebSocket) |
| **TanStack React Query** | 4.24.0 | Server state management, caching, synchronization |

### Forms & HTTP

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Hook Form** | 7.43.0 | Performant form handling with validation |
| **Axios** | 1.3.0 | HTTP client for API requests |
| **Socket.io Client** | 4.8.1 | WebSocket client for real-time updates |

### Styling & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.3.0 | Utility-first CSS framework |
| **PostCSS** | 8.4.24 | CSS transformation and processing |
| **Autoprefixer** | 10.4.14 | Automatic vendor prefixing |
| **Heroicons React** | 2.0.18 | SVG icon library |

---

## 3. Browser Extension Technologies

The Chrome extension interfaces with Google Meet for participation tracking.

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Chrome Extension Manifest V3** | 3 | Latest Chrome extension platform |
| **React** | 18.2.0 | UI for popup and options pages |
| **React DOM** | 18.2.0 | React rendering |
| **Vite** | 7.2.4 | Extension bundling and build |

### Data & Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| **idb (IndexedDB)** | 7.1.1 | Local offline data persistence |
| **uuid** | 9.0.0 | Unique identifier generation |
| **Chrome Storage API** | (built-in) | Extension settings and token storage |

### Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **date-fns** | 2.30.0 | Date formatting and manipulation |
| **@types/chrome** | 0.0.254 | TypeScript definitions for Chrome APIs |

### Extension Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Service Worker** | Manifest V3 | Background script for session coordination |
| **Content Scripts** | Vanilla JS + Modules | Google Meet DOM interaction |
| **Popup** | React | Quick session control interface |
| **Options Page** | React | Authentication and class mapping |

---

## 4. Database Technologies

### Database Engine

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 14+ | Relational database management system |
| **uuid-ossp** | (extension) | Native UUID generation in PostgreSQL |

### Database Features Used

| Feature | Purpose |
|---------|---------|
| **ENUM Types** | Type-safe status fields (user_role, session_status, interaction_type) |
| **JSONB** | Flexible storage for schedules and additional data |
| **Foreign Keys** | Referential integrity with CASCADE deletes |
| **Triggers** | Automatic `updated_at` timestamp management |
| **Indexes** | Query performance optimization |
| **Unique Constraints** | Data integrity (e.g., one attendance record per participant per session) |

---

## 5. Development Tools

### Version Control & Collaboration

| Tool | Purpose |
|------|---------|
| **Git** | Version control system |
| **GitHub** | Repository hosting and collaboration |

### Development Environment

| Tool | Purpose |
|------|---------|
| **Visual Studio Code** | Primary code editor |
| **Node Package Manager (npm)** | Package management |
| **Chrome DevTools** | Extension debugging |

### API Testing

| Tool | Purpose |
|------|---------|
| **Postman / Thunder Client** | API endpoint testing |
| **Browser DevTools** | Network request inspection |

---

## 6. Technology Selection Rationale

### Why Node.js + Express?
- **JavaScript Ecosystem**: Unified language across frontend, backend, and extension
- **Non-blocking I/O**: Efficient handling of real-time WebSocket connections
- **Rich Package Ecosystem**: npm provides extensive library support
- **Easy Integration**: Native JSON handling for API responses

### Why React?
- **Component Reusability**: Modular UI development across dashboard and extension
- **Virtual DOM**: Efficient updates for real-time data displays
- **Strong Community**: Extensive documentation and third-party libraries
- **React Query**: Simplified server state management and caching

### Why PostgreSQL?
- **ACID Compliance**: Reliable transactions for attendance data integrity
- **Complex Queries**: Efficient joins for analytics and reporting
- **JSONB Support**: Flexible storage for variable data structures
- **Scalability**: Handles growing data volumes as usage increases

### Why Socket.io?
- **Real-time Updates**: Instant event propagation to dashboard
- **Room-based Architecture**: Efficient targeted broadcasts per instructor/session
- **Automatic Reconnection**: Handles network interruptions gracefully
- **Fallback Support**: Works even when WebSockets are blocked

### Why Chrome Extension Manifest V3?
- **Modern Standard**: Google's required format for new extensions
- **Service Workers**: Efficient background processing
- **Enhanced Security**: Stricter permission model
- **Performance**: Reduced memory footprint compared to Manifest V2

---

## 7. Version Compatibility Matrix

| Component | Minimum Version | Recommended Version |
|-----------|-----------------|---------------------|
| Node.js | 16.x | 18.x or 20.x LTS |
| npm | 8.x | 9.x or 10.x |
| Chrome Browser | 120+ | Latest stable |
| PostgreSQL | 12 | 14+ |

---

## 8. Dependency Summary

### Backend (15 production dependencies)
```
express, socket.io, pg, jsonwebtoken, bcrypt, helmet, 
cors, express-rate-limit, multer, csv-parser, uuid, 
nodemailer, dotenv, crypto, autoprefixer
```

### Frontend (8 production dependencies)
```
react, react-dom, react-router-dom, @tanstack/react-query,
react-hook-form, axios, socket.io-client, @heroicons/react
```

### Extension (5 production dependencies)
```
react, react-dom, date-fns, idb, uuid
```

---

*This document reflects the technology stack as of December 2025, based on the actual package.json files and codebase implementation.*
