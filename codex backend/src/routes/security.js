const express = require('express');
const { getDatabase } = require('../database/init');
const { optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Calculate REAL security score based on actual scanned data
 * Formula:
 * score = 100 
 *   - (5 * open_ports)
 *   - (10 * critical_CVEs)
 *   - (6 * high_CVEs)
 *   - (3 * medium_CVEs)
 *   - (15 if any weak password detected)
 *   - (10 if any exposed service)
 */
function calculateSecurityScore(db) {
  try {
    // Get all devices
    const devices = db.prepare('SELECT * FROM devices').all();
    const totalDevices = devices.length;
    
    if (totalDevices === 0) {
      return {
        score: 100,
        grade: 'A',
        factors: { noDevices: true },
        breakdown: {}
      };
    }
    
    // Get all ports
    const ports = db.prepare('SELECT * FROM ports').all();
    const totalOpenPorts = ports.length;
    
    // Count dangerous ports
    const dangerousPorts = [21, 23, 3389, 5900, 8080, 8443, 37777, 554];
    const exposedPorts = ports.filter(p => dangerousPorts.includes(p.port)).length;
    
    // Get vulnerabilities
    const vulns = db.prepare('SELECT severity FROM vulnerabilities').all();
    const criticalVulns = vulns.filter(v => v.severity === 'critical').length;
    const highVulns = vulns.filter(v => v.severity === 'high').length;
    const mediumVulns = vulns.filter(v => v.severity === 'medium').length;
    
    // Get alerts
    const alerts = db.prepare("SELECT type, severity FROM alerts WHERE acknowledged = 0").all();
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const highAlerts = alerts.filter(a => a.severity === 'high').length;
    
    // Check for unknown devices (potential threats)
    const unknownDevices = devices.filter(d => 
      d.manufacturer === 'Unknown' || 
      d.manufacturer === 'Unknown Vendor' ||
      d.device_type === 'unknown'
    ).length;
    
    // Calculate score
    let score = 100;
    
    // Deductions
    const portDeduction = Math.min(30, totalOpenPorts * 2);
    const exposedPortDeduction = exposedPorts * 5;
    const criticalVulnDeduction = criticalVulns * 10;
    const highVulnDeduction = highVulns * 6;
    const mediumVulnDeduction = mediumVulns * 3;
    const criticalAlertDeduction = criticalAlerts * 8;
    const highAlertDeduction = highAlerts * 4;
    const unknownDeviceDeduction = unknownDevices * 5;
    
    score -= portDeduction;
    score -= exposedPortDeduction;
    score -= criticalVulnDeduction;
    score -= highVulnDeduction;
    score -= mediumVulnDeduction;
    score -= criticalAlertDeduction;
    score -= highAlertDeduction;
    score -= unknownDeviceDeduction;
    
    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));
    
    // Calculate grade
    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    
    return {
      score: Math.round(score),
      grade,
      factors: {
        totalDevices,
        totalOpenPorts,
        exposedPorts,
        criticalVulns,
        highVulns,
        mediumVulns,
        criticalAlerts,
        highAlerts,
        unknownDevices
      },
      breakdown: {
        portDeduction,
        exposedPortDeduction,
        criticalVulnDeduction,
        highVulnDeduction,
        mediumVulnDeduction,
        criticalAlertDeduction,
        highAlertDeduction,
        unknownDeviceDeduction
      }
    };
  } catch (error) {
    logger.error('Error calculating security score:', error);
    return { score: 0, grade: 'F', error: error.message };
  }
}

/**
 * GET /security/score - Get real-time security score
 */
router.get('/score', optionalAuth, (req, res) => {
  try {
    const db = getDatabase();
    const result = calculateSecurityScore(db);
    
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get security score error:', error);
    res.status(500).json({ error: 'Failed to calculate security score' });
  }
});

/**
 * GET /security/trends - Get security trends over time
 */
router.get('/trends', optionalAuth, (req, res) => {
  try {
    const db = getDatabase();
    const { days = 7 } = req.query;
    
    // Get current score
    const currentScore = calculateSecurityScore(db);
    
    // Get device count trend
    const deviceTrend = db.prepare(`
      SELECT DATE(discovered_at) as date, COUNT(*) as count
      FROM devices
      WHERE discovered_at >= datetime('now', '-${days} days')
      GROUP BY DATE(discovered_at)
      ORDER BY date
    `).all();
    
    // Get alert trend
    const alertTrend = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count, severity
      FROM alerts
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at), severity
      ORDER BY date
    `).all();
    
    // Get vulnerability trend
    const vulnTrend = db.prepare(`
      SELECT DATE(discovered_at) as date, COUNT(*) as count, severity
      FROM vulnerabilities
      WHERE discovered_at >= datetime('now', '-${days} days')
      GROUP BY DATE(discovered_at), severity
      ORDER BY date
    `).all();
    
    res.json({
      success: true,
      currentScore: currentScore.score,
      grade: currentScore.grade,
      trends: {
        devices: deviceTrend,
        alerts: alertTrend,
        vulnerabilities: vulnTrend
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get security trends error:', error);
    res.status(500).json({ error: 'Failed to get security trends' });
  }
});

/**
 * GET /security/summary - Get security summary
 */
router.get('/summary', optionalAuth, (req, res) => {
  try {
    const db = getDatabase();
    
    const devices = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
    const onlineDevices = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'online'").get().count;
    const criticalDevices = db.prepare("SELECT COUNT(*) as count FROM devices WHERE risk_level = 'critical'").get().count;
    const highRiskDevices = db.prepare("SELECT COUNT(*) as count FROM devices WHERE risk_level = 'high'").get().count;
    
    const alerts = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0').get().count;
    const criticalAlerts = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE severity = 'critical' AND acknowledged = 0").get().count;
    
    const vulnerabilities = db.prepare('SELECT COUNT(*) as count FROM vulnerabilities').get().count;
    const criticalVulns = db.prepare("SELECT COUNT(*) as count FROM vulnerabilities WHERE severity = 'critical'").get().count;
    
    const score = calculateSecurityScore(db);
    
    res.json({
      success: true,
      score: score.score,
      grade: score.grade,
      summary: {
        devices: {
          total: devices,
          online: onlineDevices,
          critical: criticalDevices,
          highRisk: highRiskDevices
        },
        alerts: {
          unacknowledged: alerts,
          critical: criticalAlerts
        },
        vulnerabilities: {
          total: vulnerabilities,
          critical: criticalVulns
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get security summary error:', error);
    res.status(500).json({ error: 'Failed to get security summary' });
  }
});

module.exports = router;
