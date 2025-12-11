# Black Codex - IoT Security Command Center

## What Is It?

**Black Codex** is a comprehensive **IoT (Internet of Things) Security Platform** designed to protect smart home and enterprise networks from cyber threats. It's a security dashboard that monitors, scans, and protects all connected devices on your network.

---

## Core Features & What They Do

### 1. **Dashboard** (`/`)
- **Real-time security overview** of your entire network
- Security score (0-100) showing overall network health
- Quick stats: devices online, active alerts, vulnerabilities
- **Benefit**: Instant visibility into your network's security posture

### 2. **Device Inventory** (`/inventory`)
- Lists all IoT devices on your network (cameras, thermostats, smart locks, etc.)
- Shows device details: IP, MAC, manufacturer, firmware version
- Risk scoring per device (safe/low/medium/high/critical)
- **Benefit**: Know exactly what's connected to your network

### 3. **Network Topology** (`/topology`)
- Visual map of your network showing how devices are connected
- Interactive graph with device relationships
- **Benefit**: Understand your network architecture at a glance

### 4. **Scan Engine** (`/scan`)
- Automated network scanning for new devices
- Vulnerability detection (outdated firmware, open ports, weak configs)
- Port scanning and service identification
- **Benefit**: Proactively find security weaknesses before attackers do

### 5. **Security Center** (`/security`)
- **Risk Heatmap**: Visual grid showing risk distribution
- **Vulnerability Matrix**: Track all CVEs affecting your devices
- **Anomaly Timeline**: Detect unusual network behavior
- **Threat Intelligence**: Real-time threat feeds
- **Firmware Analyzer**: Check for outdated/vulnerable firmware
- **Credential Scanner**: Detect devices using default passwords
- **Benefit**: Comprehensive security analysis in one place

### 6. **Quarantine** (`/quarantine`)
- Isolate compromised or suspicious devices from the network
- Block device communication until remediated
- **Benefit**: Contain threats before they spread

### 7. **AI Reports** (`/ai-report`)
- AI-powered security analysis and recommendations
- Natural language explanations of vulnerabilities
- Automated remediation suggestions
- **Benefit**: Expert-level security guidance without needing a security team

### 8. **Intruder Feed** (`/intruder-feed`)
- Real-time packet capture and analysis
- Detect suspicious network traffic
- Identify potential intrusion attempts
- **Benefit**: Catch hackers in the act

### 9. **Audit Logs** (`/audit`)
- Complete history of all security events
- User actions, system changes, alerts
- Exportable for compliance
- **Benefit**: Accountability and forensic investigation

### 10. **Admin Center** (`/admin`)
- User management
- System configuration
- Role-based access control
- **Benefit**: Control who can access what

---

## Who Is It For?

| User Type | Use Case |
|-----------|----------|
| **Homeowners** | Protect smart home devices (cameras, locks, thermostats) |
| **Small Businesses** | Secure office IoT devices and network |
| **IT Administrators** | Monitor enterprise IoT infrastructure |
| **Security Professionals** | Penetration testing and vulnerability assessment |
| **MSPs** | Manage security for multiple client networks |

---

## Key Benefits

| Benefit | Description |
|---------|-------------|
| 🛡️ **Prevent Breaches** | Find vulnerabilities before hackers exploit them |
| 👁️ **Complete Visibility** | See every device on your network |
| ⚡ **Real-time Alerts** | Instant notification of security threats |
| 🔒 **Device Quarantine** | Isolate compromised devices immediately |
| 🤖 **AI-Powered Analysis** | Get expert security recommendations |
| 📊 **Compliance Ready** | Audit logs for regulatory requirements |
| 🎯 **Risk Prioritization** | Focus on what matters most |
| 🔄 **Automated Scanning** | Continuous security monitoring |

---

## Real-World Example

**Scenario**: You have a smart home with:
- Ring doorbell
- Nest thermostat  
- Hikvision IP camera
- Smart TV
- IoT hub

**Black Codex will**:
1. **Discover** all these devices automatically
2. **Scan** them for vulnerabilities (e.g., camera using default password)
3. **Alert** you to critical issues (e.g., CVE affecting your camera)
4. **Recommend** fixes (e.g., "Update firmware to v5.7.0")
5. **Quarantine** the camera if it starts behaving suspiciously
6. **Monitor** 24/7 for new threats

---

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, SQLite (sql.js)
- **Real-time**: WebSockets for live updates
- **Security**: JWT authentication, rate limiting, CORS

## Server URLs

- **Frontend**: http://localhost:8080 (or http://localhost:5173)
- **Backend**: http://localhost:3001

## Default Admin Credentials

- **Email**: admin@blackcodex.local
- **Password**: ChangeMe123!

---

## Project Structure

```
codex project/
├── codex Frontend/          # React frontend application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── data/            # Mock data
│   │   └── types/           # TypeScript types
│   └── package.json
│
├── codex backend/           # Node.js backend API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── database/        # SQLite database
│   │   ├── middleware/      # Auth & audit middleware
│   │   ├── services/        # Business logic
│   │   └── websocket/       # Real-time updates
│   └── package.json
│
└── idea workflow/           # Documentation
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | User authentication |
| `GET /api/devices` | List all devices |
| `GET /api/alerts` | Get security alerts |
| `POST /api/scan/start` | Start network scan |
| `GET /api/vulnerabilities` | List vulnerabilities |
| `GET /api/cve` | Query CVE database |
| `GET /api/threats` | Threat intelligence feed |
| `POST /api/quarantine` | Quarantine a device |
| `GET /api/audit` | Audit logs |
| `GET /api/network/topology` | Network map data |
