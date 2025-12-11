const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/init');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const logger = require('../utils/logger');

const router = express.Router();

// Analyze device with AI
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { deviceId, analysisType = 'full' } = req.body;
    const db = getDatabase();

    // Get device information
    const device = db.prepare(`
      SELECT * FROM devices WHERE id = ?
    `).get(deviceId);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Get device vulnerabilities
    const vulnerabilities = db.prepare(`
      SELECT * FROM vulnerabilities WHERE device_id = ? AND status = 'open'
    `).all(deviceId);

    // Get device ports
    const ports = db.prepare(`
      SELECT * FROM ports WHERE device_id = ?
    `).all(deviceId);

    // Simulate AI analysis (in production, this would call an actual AI service)
    const analysis = performAIAnalysis(device, vulnerabilities, ports, analysisType);

    // Store the analysis result
    const reportId = uuidv4();
    db.prepare(`
      INSERT INTO ai_reports (id, device_id, analysis_type, report_data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(reportId, deviceId, analysisType, JSON.stringify(analysis), new Date().toISOString());

    logAudit(req.user.id, 'AI_ANALYSIS_PERFORMED', 'device', deviceId, { analysisType }, req);

    res.json({
      reportId,
      deviceId,
      analysis
    });
  } catch (error) {
    logger.error('AI analysis error:', error);
    res.status(500).json({ error: 'Failed to perform AI analysis' });
  }
});

// Get AI report for a device
router.get('/report/:deviceId', authenticate, (req, res) => {
  try {
    const db = getDatabase();
    const reports = db.prepare(`
      SELECT * FROM ai_reports 
      WHERE device_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(req.params.deviceId);

    if (reports.length === 0) {
      return res.status(404).json({ error: 'No reports found for this device' });
    }

    // Parse the JSON report data
    const parsedReports = reports.map(r => ({
      ...r,
      report_data: JSON.parse(r.report_data)
    }));

    res.json(parsedReports);
  } catch (error) {
    logger.error('Get AI report error:', error);
    res.status(500).json({ error: 'Failed to fetch AI report' });
  }
});

// AI Chat endpoint
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, context = {} } = req.body;

    // Simulate AI chat response (in production, this would call an actual AI service like OpenAI)
    const response = generateChatResponse(message, context);

    logAudit(req.user.id, 'AI_CHAT', 'chat', null, { messageLength: message.length }, req);

    res.json({
      message: response.message,
      suggestions: response.suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Get security recommendations
router.get('/recommendations', authenticate, (req, res) => {
  try {
    const db = getDatabase();

    // Get network statistics
    const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
    const criticalVulns = db.prepare("SELECT COUNT(*) as count FROM vulnerabilities WHERE severity = 'critical' AND status = 'open'").get().count;
    const openPorts = db.prepare('SELECT COUNT(*) as count FROM ports WHERE status = ?').get('open').count;

    // Generate recommendations based on network state
    const recommendations = generateRecommendations({
      deviceCount,
      criticalVulns,
      openPorts
    });

    res.json(recommendations);
  } catch (error) {
    logger.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Analyze network-wide security
router.post('/analyze-network', authenticate, async (req, res) => {
  try {
    const db = getDatabase();

    // Get all devices
    const devices = db.prepare('SELECT * FROM devices WHERE status != ?').all('offline');
    
    // Get all open vulnerabilities
    const vulnerabilities = db.prepare("SELECT * FROM vulnerabilities WHERE status = 'open'").all();

    // Get recent alerts
    const alerts = db.prepare(`
      SELECT * FROM alerts 
      WHERE created_at > datetime('now', '-7 days')
      ORDER BY created_at DESC
    `).all();

    // Perform network-wide analysis
    const networkAnalysis = performNetworkAnalysis(devices, vulnerabilities, alerts);

    logAudit(req.user.id, 'NETWORK_ANALYSIS_PERFORMED', 'network', null, {}, req);

    res.json(networkAnalysis);
  } catch (error) {
    logger.error('Network analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze network' });
  }
});

// Helper function to perform AI analysis
function performAIAnalysis(device, vulnerabilities, ports, analysisType) {
  const analysis = {
    summary: '',
    riskAssessment: {
      score: device.risk_score || 0,
      level: device.risk_level || 'unknown',
      factors: []
    },
    vulnerabilities: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      details: []
    },
    recommendations: [],
    portAnalysis: [],
    timestamp: new Date().toISOString()
  };

  // Count vulnerabilities by severity
  for (const vuln of vulnerabilities) {
    analysis.vulnerabilities[vuln.severity]++;
    analysis.vulnerabilities.details.push({
      cveId: vuln.cve_id,
      title: vuln.title,
      severity: vuln.severity,
      cvssScore: vuln.cvss_score
    });
  }

  // Analyze ports
  const riskyPorts = [21, 23, 135, 139, 445, 3389];
  for (const port of ports) {
    const isRisky = riskyPorts.includes(port.port_number);
    analysis.portAnalysis.push({
      port: port.port_number,
      service: port.service_name,
      status: port.status,
      risk: isRisky ? 'high' : 'low'
    });
    if (isRisky && port.status === 'open') {
      analysis.riskAssessment.factors.push(`Risky port ${port.port_number} (${port.service_name}) is open`);
    }
  }

  // Generate summary
  if (analysis.vulnerabilities.critical > 0) {
    analysis.summary = `Device "${device.name}" has ${analysis.vulnerabilities.critical} critical vulnerabilities requiring immediate attention.`;
    analysis.riskAssessment.factors.push(`${analysis.vulnerabilities.critical} critical vulnerabilities`);
  } else if (analysis.vulnerabilities.high > 0) {
    analysis.summary = `Device "${device.name}" has ${analysis.vulnerabilities.high} high-severity vulnerabilities that should be addressed.`;
    analysis.riskAssessment.factors.push(`${analysis.vulnerabilities.high} high-severity vulnerabilities`);
  } else {
    analysis.summary = `Device "${device.name}" has a relatively low risk profile.`;
  }

  // Generate recommendations
  if (analysis.vulnerabilities.critical > 0) {
    analysis.recommendations.push({
      priority: 'critical',
      action: 'Patch critical vulnerabilities immediately',
      details: 'Critical vulnerabilities can be exploited remotely and may lead to complete system compromise.'
    });
  }

  if (ports.some(p => p.port_number === 23 && p.status === 'open')) {
    analysis.recommendations.push({
      priority: 'high',
      action: 'Disable Telnet and use SSH instead',
      details: 'Telnet transmits data in plaintext, making it vulnerable to eavesdropping.'
    });
  }

  if (device.firmware_version && device.firmware_version.includes('1.0')) {
    analysis.recommendations.push({
      priority: 'medium',
      action: 'Update device firmware',
      details: 'Older firmware versions may contain known vulnerabilities.'
    });
  }

  return analysis;
}

// Helper function to generate chat responses
function generateChatResponse(message, context) {
  const lowerMessage = message.toLowerCase();
  let response = {
    message: '',
    suggestions: []
  };

  if (lowerMessage.includes('vulnerability') || lowerMessage.includes('cve')) {
    response.message = 'I can help you analyze vulnerabilities in your network. Based on the current scan data, I recommend focusing on critical and high-severity vulnerabilities first. Would you like me to generate a detailed vulnerability report?';
    response.suggestions = ['Show critical vulnerabilities', 'Generate vulnerability report', 'How to patch CVE-2023-1234'];
  } else if (lowerMessage.includes('scan') || lowerMessage.includes('network')) {
    response.message = 'I can help you with network scanning. You can start a full network scan to discover all devices and their security posture. Would you like to initiate a scan now?';
    response.suggestions = ['Start network scan', 'Show scan history', 'Configure scan settings'];
  } else if (lowerMessage.includes('device') || lowerMessage.includes('iot')) {
    response.message = 'I can provide information about devices in your network. This includes device types, manufacturers, firmware versions, and associated vulnerabilities. What would you like to know?';
    response.suggestions = ['List all devices', 'Show vulnerable devices', 'Device risk assessment'];
  } else if (lowerMessage.includes('risk') || lowerMessage.includes('security')) {
    response.message = 'I can assess the security posture of your network. This includes analyzing vulnerabilities, open ports, firmware versions, and compliance with security best practices.';
    response.suggestions = ['Show security score', 'Risk assessment', 'Security recommendations'];
  } else {
    response.message = "I'm your AI security assistant for the Black Codex platform. I can help you with vulnerability analysis, network scanning, device management, and security recommendations. How can I assist you today?";
    response.suggestions = ['Analyze network security', 'Show recent alerts', 'Generate security report'];
  }

  return response;
}

// Helper function to generate recommendations
function generateRecommendations(stats) {
  const recommendations = [];

  if (stats.criticalVulns > 0) {
    recommendations.push({
      id: 'rec-1',
      priority: 'critical',
      title: 'Address Critical Vulnerabilities',
      description: `You have ${stats.criticalVulns} critical vulnerabilities that require immediate attention.`,
      action: 'View Vulnerabilities',
      actionUrl: '/vulnerabilities?severity=critical'
    });
  }

  if (stats.openPorts > 50) {
    recommendations.push({
      id: 'rec-2',
      priority: 'high',
      title: 'Review Open Ports',
      description: `You have ${stats.openPorts} open ports across your network. Consider closing unnecessary ports.`,
      action: 'View Port Analysis',
      actionUrl: '/topology'
    });
  }

  recommendations.push({
    id: 'rec-3',
    priority: 'medium',
    title: 'Schedule Regular Scans',
    description: 'Set up automated network scans to continuously monitor for new vulnerabilities.',
    action: 'Configure Scans',
    actionUrl: '/scan-engine'
  });

  recommendations.push({
    id: 'rec-4',
    priority: 'low',
    title: 'Update Device Firmware',
    description: 'Regularly check and update firmware for all IoT devices to patch known vulnerabilities.',
    action: 'View Devices',
    actionUrl: '/inventory'
  });

  return recommendations;
}

// Helper function for network-wide analysis
function performNetworkAnalysis(devices, vulnerabilities, alerts) {
  const analysis = {
    overallRisk: 0,
    riskLevel: 'low',
    devicesByRisk: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      safe: 0
    },
    vulnerabilityTrends: [],
    topThreats: [],
    recommendations: [],
    timestamp: new Date().toISOString()
  };

  // Calculate device risk distribution
  for (const device of devices) {
    const level = device.risk_level || 'safe';
    if (analysis.devicesByRisk[level] !== undefined) {
      analysis.devicesByRisk[level]++;
    }
  }

  // Calculate overall risk
  const riskWeights = { critical: 100, high: 75, medium: 50, low: 25, safe: 0 };
  let totalWeight = 0;
  let totalDevices = devices.length || 1;

  for (const [level, count] of Object.entries(analysis.devicesByRisk)) {
    totalWeight += (riskWeights[level] || 0) * count;
  }

  analysis.overallRisk = Math.round(totalWeight / totalDevices);

  if (analysis.overallRisk >= 80) analysis.riskLevel = 'critical';
  else if (analysis.overallRisk >= 60) analysis.riskLevel = 'high';
  else if (analysis.overallRisk >= 40) analysis.riskLevel = 'medium';
  else if (analysis.overallRisk >= 20) analysis.riskLevel = 'low';
  else analysis.riskLevel = 'safe';

  // Generate top threats
  const vulnBySeverity = {};
  for (const vuln of vulnerabilities) {
    const key = vuln.cve_id || vuln.title;
    if (!vulnBySeverity[key]) {
      vulnBySeverity[key] = {
        id: vuln.cve_id || vuln.id,
        title: vuln.title,
        severity: vuln.severity,
        count: 0,
        cvssScore: vuln.cvss_score
      };
    }
    vulnBySeverity[key].count++;
  }

  analysis.topThreats = Object.values(vulnBySeverity)
    .sort((a, b) => (b.cvssScore || 0) - (a.cvssScore || 0))
    .slice(0, 10);

  // Network-wide recommendations
  if (analysis.devicesByRisk.critical > 0) {
    analysis.recommendations.push({
      priority: 'critical',
      message: `${analysis.devicesByRisk.critical} device(s) are at critical risk. Immediate action required.`
    });
  }

  if (vulnerabilities.length > 50) {
    analysis.recommendations.push({
      priority: 'high',
      message: 'High number of open vulnerabilities. Consider prioritizing remediation based on CVSS scores.'
    });
  }

  return analysis;
}

module.exports = router;
