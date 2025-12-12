const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let wss = null;
const clients = new Map();

function initializeWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientId = uuidv4();
    clients.set(clientId, {
      ws,
      subscriptions: new Set(),
      authenticated: false,
      userId: null
    });

    logger.info(`WebSocket client connected: ${clientId}`);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      message: 'Connected to Black Codex WebSocket server'
    }));

    // Try authenticate from query param token if present
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      if (token) {
        // perform authentication
        handleAuthenticate(clientId, token);
      }
    } catch (e) {
      // ignore URL parse errors
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleMessage(clientId, data);
      } catch (error) {
        logger.error('WebSocket message error:', error);
        try {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        } catch (e) {
          logger.error('Failed to send error message to client', e);
        }
      }
    });
    ws.on('close', () => {
      clients.delete(clientId);
      logger.info(`WebSocket client disconnected: ${clientId}`);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
    });
  });

  logger.info('WebSocket server initialized');
  return wss;
}

function handleMessage(clientId, data) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (data.type) {
    case 'authenticate':
      handleAuthenticate(clientId, data.token);
      break;
    case 'subscribe':
      handleSubscribe(clientId, data.channel);
      break;
    case 'unsubscribe':
      handleUnsubscribe(clientId, data.channel);
      break;
    case 'ping':
      client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    default:
      client.ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

function handleAuthenticate(clientId, token) {
  const client = clients.get(clientId);
  if (!client) return;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    client.authenticated = true;
    client.userId = decoded.userId;

    client.ws.send(JSON.stringify({
      type: 'authenticated',
      userId: decoded.userId,
      message: 'Authentication successful'
    }));

    logger.info(`WebSocket client ${clientId} authenticated as user ${decoded.userId}`);
  } catch (error) {
    client.ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication failed'
    }));
  }
}

function handleSubscribe(clientId, channel) {
  const client = clients.get(clientId);
  if (!client) return;

  const validChannels = ['alerts', 'devices', 'scan', 'scans', 'packets', 'system'];
  const protectedChannels = new Set(['devices', 'scans', 'packets', 'system']);

  if (!validChannels.includes(channel)) {
    client.ws.send(JSON.stringify({ type: 'error', message: `Invalid channel: ${channel}` }));
    return;
  }

  // Require authentication for protected channels
  if (protectedChannels.has(channel) && !client.authenticated) {
    client.ws.send(JSON.stringify({ type: 'error', message: `Authentication required to subscribe to ${channel}` }));
    logger.warn(`Client ${clientId} denied subscription to protected channel ${channel}`);
    return;
  }

  client.subscriptions.add(channel);
  client.ws.send(JSON.stringify({ type: 'subscribed', channel, message: `Subscribed to ${channel}` }));
  logger.info(`Client ${clientId} subscribed to ${channel}`);
}

function handleUnsubscribe(clientId, channel) {
  const client = clients.get(clientId);
  if (!client) return;

  client.subscriptions.delete(channel);
  client.ws.send(JSON.stringify({
    type: 'unsubscribed',
    channel,
    message: `Unsubscribed from ${channel}`
  }));

  logger.info(`Client ${clientId} unsubscribed from ${channel}`);
}

// Broadcast to all clients subscribed to a channel
function broadcast(channel, data) {
  const message = JSON.stringify({
    type: 'broadcast',
    channel,
    data,
    timestamp: new Date().toISOString()
  });

  const protectedChannels = new Set(['devices', 'scans', 'packets', 'system']);

  clients.forEach((client, clientId) => {
    // If channel is protected, only send to authenticated clients
    if (!client.subscriptions.has(channel) || client.ws.readyState !== WebSocket.OPEN) return;
    if (protectedChannels.has(channel) && !client.authenticated) return;
    try {
      client.ws.send(message);
    } catch (error) {
      logger.error(`Failed to send to client ${clientId}:`, error);
    }
  });
}

// Broadcast to all authenticated clients
function broadcastToAll(data) {
  const message = JSON.stringify({
    type: 'broadcast',
    channel: 'all',
    data,
    timestamp: new Date().toISOString()
  });

  clients.forEach((client, clientId) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(message);
      } catch (error) {
        logger.error(`Failed to send to client ${clientId}:`, error);
      }
    }
  });
}

// Send to specific user
function sendToUser(userId, data) {
  const message = JSON.stringify({
    type: 'direct',
    data,
    timestamp: new Date().toISOString()
  });

  clients.forEach((client, clientId) => {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(message);
      } catch (error) {
        logger.error(`Failed to send to user ${userId}:`, error);
      }
    }
  });
}

// Emit events for different types of updates
const emit = {
  // Alert events
  newAlert: (alert) => {
    broadcast('alerts', { event: 'new_alert', alert });
  },
  alertAcknowledged: (alertId) => {
    broadcast('alerts', { event: 'alert_acknowledged', alertId });
  },

  // Device events
  deviceOnline: (device) => {
    broadcast('devices', { event: 'device_online', device });
  },
  deviceOffline: (device) => {
    broadcast('devices', { event: 'device_offline', device });
  },
  deviceUpdated: (device) => {
    broadcast('devices', { event: 'device_updated', device });
  },
  deviceQuarantined: (device) => {
    broadcast('devices', { event: 'device_quarantined', device });
  },
  newDevice: (device) => {
    broadcast('devices', { event: 'new_device', device });
  },

  // Scan events
  scanStarted: (scan) => {
    broadcast('scans', { event: 'scan_started', scan });
  },
  scanProgress: (scanId, progress) => {
    broadcast('scans', { event: 'scan_progress', scanId, progress });
  },
  scanCompleted: (scan) => {
    broadcast('scans', { event: 'scan_completed', scan });
  },
  scanFailed: (scanId, error) => {
    broadcast('scans', { event: 'scan_failed', scanId, error });
  },

  // Packet events
  packetCaptured: (packet) => {
    broadcast('packets', { event: 'packet_captured', packet });
  },

  // System events
  systemStatus: (status) => {
    broadcast('system', { event: 'system_status', status });
  },
  configUpdated: (config) => {
    broadcast('system', { event: 'config_updated', config });
  }
};

function getConnectedClients() {
  return {
    total: clients.size,
    authenticated: Array.from(clients.values()).filter(c => c.authenticated).length,
    subscriptions: Array.from(clients.values()).reduce((acc, client) => {
      client.subscriptions.forEach(s => {
        acc[s] = (acc[s] || 0) + 1;
      });
      return acc;
    }, {})
  };
}

function emitDeviceQuarantined({ ip, by, reason }) {
  broadcast('device.quarantined', { ip, by, reason });
}

module.exports = {
  initializeWebSocket,
  broadcast,
  broadcastToAll,
  sendToUser,
  emit,
  getConnectedClients,
  emitDeviceQuarantined,
};
