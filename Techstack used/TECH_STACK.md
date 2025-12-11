# Black Codex - Complete Tech Stack Documentation

## Overview

Black Codex is built with a modern, production-ready tech stack focusing on performance, security, and developer experience.

---

# 🎨 FRONTEND STACK

## Core Framework

### React 18.3.1
- **What**: JavaScript library for building user interfaces
- **Why**: Component-based architecture, virtual DOM, large ecosystem
- **Features Used**:
  - Functional components with Hooks
  - React.lazy() for code splitting
  - Suspense for loading states
  - StrictMode for development warnings

### TypeScript 5.6.2
- **What**: Typed superset of JavaScript
- **Why**: Type safety, better IDE support, catch errors at compile time
- **Configuration**: Strict mode enabled (`tsconfig.json`)
- **Features Used**:
  - Interface definitions for all data types
  - Generic types for reusable components
  - Type guards for runtime checks

### Vite 5.4.10
- **What**: Next-generation frontend build tool
- **Why**: Lightning-fast HMR, optimized builds, native ES modules
- **Features**:
  - Dev server with instant hot reload
  - Optimized production builds
  - CSS code splitting
  - Asset optimization

---

## UI Framework & Styling

### Tailwind CSS 3.4.14
- **What**: Utility-first CSS framework
- **Why**: Rapid development, consistent design, small bundle size
- **Configuration**: Custom theme in `tailwind.config.ts`
- **Features Used**:
  - Custom color palette (cyber/neon theme)
  - Dark mode support
  - Responsive breakpoints
  - Animation utilities

### shadcn/ui
- **What**: Re-usable component library built on Radix UI
- **Why**: Accessible, customizable, copy-paste components
- **Components Used**:
  ```
  accordion, alert, alert-dialog, avatar, badge, breadcrumb,
  button, calendar, card, carousel, chart, checkbox, collapsible,
  command, context-menu, dialog, drawer, dropdown-menu, form,
  hover-card, input, label, menubar, navigation-menu, pagination,
  popover, progress, radio-group, resizable, scroll-area, select,
  separator, sheet, sidebar, skeleton, slider, sonner, switch,
  table, tabs, textarea, toast, toggle, tooltip
  ```

### Radix UI Primitives
- **What**: Low-level UI primitives for React
- **Why**: Accessibility-first, unstyled, composable
- **Packages**:
  - `@radix-ui/react-accordion`
  - `@radix-ui/react-alert-dialog`
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-label`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-progress`
  - `@radix-ui/react-scroll-area`
  - `@radix-ui/react-select`
  - `@radix-ui/react-separator`
  - `@radix-ui/react-slider`
  - `@radix-ui/react-slot`
  - `@radix-ui/react-switch`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-toast`
  - `@radix-ui/react-toggle`
  - `@radix-ui/react-toggle-group`
  - `@radix-ui/react-tooltip`

---

## Animation & Visualization

### Framer Motion 11.11.17
- **What**: Production-ready motion library for React
- **Why**: Declarative animations, gestures, layout animations
- **Features Used**:
  - Page transitions
  - Component enter/exit animations
  - Hover and tap effects
  - Staggered list animations

### React Flow 11.11.4
- **What**: Library for building node-based graphs
- **Why**: Network topology visualization
- **Features Used**:
  - Custom node types (NetworkNode)
  - Interactive pan/zoom
  - Edge connections
  - Mini map

### Recharts 2.13.3
- **What**: Composable charting library for React
- **Why**: Security trends, analytics visualization
- **Chart Types Used**:
  - Line charts (security trends)
  - Bar charts (vulnerability distribution)
  - Pie charts (device types)
  - Area charts (network traffic)

---

## Routing & State Management

### React Router DOM 6.28.0
- **What**: Declarative routing for React
- **Why**: SPA navigation, nested routes, URL parameters
- **Features Used**:
  - BrowserRouter for HTML5 history
  - Route configuration
  - Navigation guards
  - Dynamic route parameters

### TanStack Query (React Query) 5.60.5
- **What**: Async state management library
- **Why**: Server state caching, background refetching, optimistic updates
- **Features Used**:
  - Query caching
  - Automatic refetching
  - Loading/error states
  - Mutation handling

---

## Forms & Validation

### React Hook Form 7.53.2
- **What**: Performant form library
- **Why**: Minimal re-renders, easy validation, small bundle
- **Features Used**:
  - Form state management
  - Field validation
  - Error handling
  - Submit handling

### Zod 3.23.8
- **What**: TypeScript-first schema validation
- **Why**: Runtime validation with type inference
- **Features Used**:
  - Schema definitions
  - Form validation with @hookform/resolvers
  - API response validation

---

## Utilities

### date-fns 4.1.0
- **What**: Modern JavaScript date utility library
- **Why**: Lightweight, tree-shakeable, immutable
- **Functions Used**:
  - `format()` - date formatting
  - `formatDistanceToNow()` - relative time
  - `parseISO()` - ISO string parsing

### clsx 2.1.1 & tailwind-merge
- **What**: Utility for constructing className strings
- **Why**: Conditional classes, merge Tailwind classes
- **Usage**: Combined in `lib/utils.ts` as `cn()` function

### Lucide React 0.460.0
- **What**: Beautiful & consistent icon library
- **Why**: Tree-shakeable, customizable, 1000+ icons
- **Icons Used**: Shield, Wifi, AlertTriangle, Eye, Lock, Settings, etc.

### Sonner 1.7.0
- **What**: Toast notification library
- **Why**: Beautiful, accessible, customizable toasts
- **Features**: Success, error, loading, custom toasts

---

## Development Dependencies

### ESLint 9.13.0
- **What**: JavaScript linter
- **Why**: Code quality, consistency, catch bugs
- **Plugins**:
  - `eslint-plugin-react-hooks`
  - `eslint-plugin-react-refresh`
  - `@typescript-eslint/eslint-plugin`

### PostCSS 8.4.49
- **What**: CSS transformation tool
- **Why**: Required for Tailwind CSS processing
- **Plugins**:
  - `autoprefixer`
  - `tailwindcss`

---

# ⚙️ BACKEND STACK

## Runtime & Framework

### Node.js 18+
- **What**: JavaScript runtime built on Chrome's V8 engine
- **Why**: Non-blocking I/O, large ecosystem, JavaScript everywhere
- **Features Used**:
  - ES modules
  - Async/await
  - Streams
  - Clustering support

### Express.js 4.21.1
- **What**: Minimal web framework for Node.js
- **Why**: Industry standard, middleware ecosystem, simple API
- **Features Used**:
  - Route handling
  - Middleware stack
  - Error handling
  - Static file serving

---

## Database

### SQLite with sql.js 1.9.0
- **What**: In-browser/Node.js SQL database
- **Why**: Zero configuration, serverless, pure JavaScript (no native compilation)
- **Features**:
  - Full SQL support
  - Persistent storage to file
  - No external dependencies
  - Works on any platform

### Database Schema Tables:
```sql
- users              # User accounts & authentication
- devices            # IoT device inventory
- vulnerabilities    # Security vulnerabilities
- ports              # Open ports per device
- alerts             # Security alerts
- scans              # Scan history
- misconfigurations  # Device misconfigurations
- anomalies          # Network anomalies
- cve_cache          # CVE database cache
- cve_database       # Full CVE records
- threats            # Threat intelligence
- threat_intelligence # Detailed threat data
- packets            # Captured packets
- packet_captures    # Packet capture sessions
- capture_sessions   # Active capture sessions
- quarantine_actions # Quarantine history
- ai_reports         # AI analysis reports
- settings           # System settings
- audit_logs         # Audit trail
- security_reports   # Generated reports
- default_credentials # Known default passwords
```

---

## Authentication & Security

### JWT (jsonwebtoken 9.0.2)
- **What**: JSON Web Token implementation
- **Why**: Stateless authentication, secure, industry standard
- **Features**:
  - Token signing with HS256
  - Expiration handling
  - Payload encryption
  - Refresh tokens

### bcryptjs 2.4.3
- **What**: Password hashing library
- **Why**: Secure password storage, adaptive cost factor
- **Usage**: Hash passwords with salt rounds of 10

### Helmet 8.0.0
- **What**: Security middleware for Express
- **Why**: Sets various HTTP headers for security
- **Headers Set**:
  - Content-Security-Policy
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection

### CORS 2.8.5
- **What**: Cross-Origin Resource Sharing middleware
- **Why**: Allow frontend to access backend API
- **Configuration**: Whitelist localhost origins

### express-rate-limit 7.4.1
- **What**: Rate limiting middleware
- **Why**: Prevent brute force attacks, API abuse
- **Configuration**: 100 requests per 15 minutes

### express-validator 7.2.0
- **What**: Input validation middleware
- **Why**: Sanitize and validate request data
- **Features Used**:
  - Body validation
  - Query validation
  - Custom validators
  - Sanitization

---

## Real-time Communication

### ws 8.18.0
- **What**: WebSocket library for Node.js
- **Why**: Real-time bidirectional communication
- **Features Used**:
  - Room-based subscriptions
  - Authentication over WebSocket
  - Broadcast to all/specific clients
  - Connection heartbeat

---

## Scheduling & Background Tasks

### node-cron 3.0.3
- **What**: Cron-like job scheduler
- **Why**: Scheduled security scans, cleanup tasks
- **Scheduled Jobs**:
  - Device health check (every 5 minutes)
  - Anomaly detection (every minute)
  - Threat feed update (hourly)
  - Database cleanup (daily)

---

## Logging

### Winston 3.17.0
- **What**: Versatile logging library
- **Why**: Multiple transports, log levels, formatting
- **Configuration**:
  - Console output with colors
  - File output (rotating)
  - JSON format for production
  - Timestamp and service name

---

## Utilities

### uuid 11.0.3
- **What**: UUID generator
- **Why**: Unique identifiers for all database records
- **Version**: v4 (random)

### dotenv 16.4.5
- **What**: Environment variable loader
- **Why**: Configuration management, secrets handling
- **Usage**: Load `.env` file at startup

### morgan 1.10.0
- **What**: HTTP request logger middleware
- **Why**: Request logging, debugging, monitoring
- **Format**: Combined format piped to Winston

---

## Development Dependencies

### Nodemon 3.1.7
- **What**: Auto-restart on file changes
- **Why**: Development productivity
- **Configuration**: Watch all .js files

---

# 📁 PROJECT STRUCTURE

```
codex project/
│
├── codex Frontend/
│   ├── public/
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── dashboard/       # Dashboard widgets
│   │   │   ├── devices/         # Device components
│   │   │   ├── layout/          # Header, Layout
│   │   │   ├── topology/        # Network map
│   │   │   ├── scan/            # Scan components
│   │   │   ├── quarantine/      # Quarantine modal
│   │   │   ├── ai/              # AI report components
│   │   │   └── security/        # Security center components
│   │   ├── pages/               # Route pages
│   │   ├── hooks/               # Custom React hooks
│   │   ├── data/                # Mock data
│   │   ├── lib/                 # Utilities
│   │   └── types/               # TypeScript types
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── codex backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js          # Authentication
│   │   │   ├── devices.js       # Device CRUD
│   │   │   ├── alerts.js        # Alert management
│   │   │   ├── scan.js          # Network scanning
│   │   │   ├── vulnerabilities.js
│   │   │   ├── cve.js           # CVE database
│   │   │   ├── threats.js       # Threat intel
│   │   │   ├── packets.js       # Packet capture
│   │   │   ├── reports.js       # Report generation
│   │   │   ├── settings.js      # Configuration
│   │   │   ├── audit.js         # Audit logs
│   │   │   ├── ai.js            # AI analysis
│   │   │   ├── quarantine.js    # Device isolation
│   │   │   ├── network.js       # Topology
│   │   │   └── credentials.js   # Credential scanning
│   │   ├── database/
│   │   │   ├── init.js          # DB initialization
│   │   │   └── seed.js          # Demo data
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verification
│   │   │   └── audit.js         # Audit logging
│   │   ├── services/
│   │   │   ├── networkScanner.js # Scan logic
│   │   │   └── scheduler.js     # Cron jobs
│   │   ├── websocket/
│   │   │   └── server.js        # WebSocket server
│   │   ├── utils/
│   │   │   └── logger.js        # Winston config
│   │   └── server.js            # Express app
│   ├── data/                    # SQLite database file
│   ├── logs/                    # Log files
│   ├── package.json
│   ├── .env                     # Environment config
│   └── .env.example
│
└── idea workflow/               # Documentation
    ├── BLACK_CODEX_OVERVIEW.md
    └── TECH_STACK.md
```

---

# 🔧 CONFIGURATION FILES

## Frontend

### vite.config.ts
```typescript
- Dev server port: 8080
- API proxy to backend
- Path aliases (@/)
- Build optimization
```

### tailwind.config.ts
```typescript
- Custom colors (cyber theme)
- Dark mode: class-based
- Custom animations
- Extended spacing
```

### tsconfig.json
```typescript
- Strict mode: true
- Target: ES2020
- Module: ESNext
- Path aliases
```

## Backend

### .env Configuration
```env
NODE_ENV=development
PORT=3001
DATABASE_PATH=./data/codex.db
JWT_SECRET=<secret>
JWT_EXPIRES_IN=7d
SCAN_SUBNET=192.168.1.0/24
CORS_ORIGIN=http://localhost:5173
```

---

# 📦 PACKAGE VERSIONS

## Frontend (package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3.1 | UI framework |
| react-dom | 18.3.1 | React DOM rendering |
| react-router-dom | 6.28.0 | Routing |
| typescript | 5.6.2 | Type safety |
| vite | 5.4.10 | Build tool |
| tailwindcss | 3.4.14 | CSS framework |
| framer-motion | 11.11.17 | Animations |
| @tanstack/react-query | 5.60.5 | Data fetching |
| react-hook-form | 7.53.2 | Form handling |
| zod | 3.23.8 | Validation |
| recharts | 2.13.3 | Charts |
| @xyflow/react | 12.3.5 | Network topology |
| lucide-react | 0.460.0 | Icons |
| date-fns | 4.1.0 | Date utilities |
| clsx | 2.1.1 | Class utilities |
| sonner | 1.7.0 | Toasts |

## Backend (package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| express | 4.21.1 | Web framework |
| sql.js | 1.9.0 | SQLite database |
| jsonwebtoken | 9.0.2 | JWT auth |
| bcryptjs | 2.4.3 | Password hashing |
| helmet | 8.0.0 | Security headers |
| cors | 2.8.5 | CORS handling |
| express-rate-limit | 7.4.1 | Rate limiting |
| express-validator | 7.2.0 | Input validation |
| ws | 8.18.0 | WebSockets |
| node-cron | 3.0.3 | Job scheduling |
| winston | 3.17.0 | Logging |
| uuid | 11.0.3 | ID generation |
| dotenv | 16.4.5 | Env config |
| morgan | 1.10.0 | HTTP logging |
| nodemon | 3.1.7 | Dev auto-reload |

---

# 🚀 COMMANDS

## Frontend
```bash
cd "codex Frontend"
npm install          # Install dependencies
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Backend
```bash
cd "codex backend"
npm install          # Install dependencies
npm run dev          # Start with nodemon (port 3001)
npm start            # Start production server
```

---

# 🔒 SECURITY FEATURES

| Layer | Implementation |
|-------|----------------|
| **Authentication** | JWT with bcrypt password hashing |
| **Authorization** | Role-based access control (admin/user) |
| **Input Validation** | express-validator on all routes |
| **Rate Limiting** | 100 requests per 15 minutes |
| **CORS** | Whitelist specific origins |
| **Headers** | Helmet security headers |
| **SQL Injection** | Parameterized queries |
| **XSS Prevention** | Input sanitization |
| **Audit Trail** | All actions logged |
