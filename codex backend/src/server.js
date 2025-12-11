require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initializeDatabase, saveDatabase } = require('./database/init');
const { initializeWebSocket } = require('./websocket/server');
const { startScheduledTasks } = require('./services/scheduler');
const { performInitialScan } = require('./services/realNetworkScanner');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const alertRoutes = require('./routes/alerts');
const scanRoutes = require('./routes/scan');
const vulnerabilityRoutes = require('./routes/vulnerabilities');
const cveRoutes = require('./routes/cve');
const threatRoutes = require('./routes/threats');
const packetRoutes = require('./routes/packets');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const auditRoutes = require('./routes/audit');
const aiRoutes = require('./routes/ai');
const quarantineRoutes = require('./routes/quarantine');
const networkRoutes = require('./routes/network');
const credentialsRoutes = require('./routes/credentials');
const securityRoutes = require('./routes/security');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Black Codex Backend'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/vulnerabilities', vulnerabilityRoutes);
app.use('/api/cve', cveRoutes);
app.use('/api/threats', threatRoutes);
app.use('/api/packets', packetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quarantine', quarantineRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/credentials', credentialsRoutes);
app.use('/api/security', securityRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');

    // Perform initial real network scan (NO DEMO DATA)
    logger.info('Starting initial network scan...');
    performInitialScan().then(result => {
      logger.info(`Initial scan complete: Found ${result.deviceCount} real devices`);
    }).catch(err => {
      logger.error('Initial scan failed:', err.message);
    });

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Black Codex Backend running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Initialize WebSocket server
    initializeWebSocket(server);
    logger.info('WebSocket server initialized');

    // Start scheduled tasks
    startScheduledTasks();
    logger.info('Scheduled tasks started');

    // Save database periodically (every 5 minutes)
    setInterval(() => {
      saveDatabase();
    }, 5 * 60 * 1000);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      saveDatabase();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      saveDatabase();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
