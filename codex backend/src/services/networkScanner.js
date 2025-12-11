const { v4: uuidv4 } = require('uuid');
const { getDatabase, saveDatabase } = require('../database/init');
const logger = require('../utils/logger');

// Store active scans in memory
const activeScans = new Map();

/**
 * Get subnet from IP and CIDR
 */
function getIPRange(subnet) {
  const [baseIP, cidr] = subnet.split('/');
  const parts = baseIP.split('.').map(Number);
  const maskBits = parseInt(cidr, 10);
  const hostBits = 32 - maskBits;
  const numHosts = Math.pow(2, hostBits) - 2; // Exclude network and broadcast
  
  const ips = [];
  const baseNum = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
  
  for (let i = 1; i <= Math.min(numHosts, 254); i++) {
    const ipNum = baseNum + i;
    const ip = [
      (ipNum >> 24) & 255,
      (ipNum >> 16) & 255,
      (ipNum >> 8) & 255,
      ipNum & 255
    ].join('.');
    ips.push(ip);
  }
  
  return ips;
}

/**
 * Generate mock MAC address
 */
function generateMAC() {
  const hex = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    if (i > 0) mac += ':';
    mac += hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)];
  }
  return mac;
}

/**
 * Mock device type detection
 */
function detectDeviceType(ip, openPorts) {
  if (openPorts.includes(554)) return 'camera';
  if (openPorts.includes(5000) || openPorts.includes(5001)) return 'nas';
  if (ip.endsWith('.1')) return 'router';
  if (openPorts.includes(80) && openPorts.includes(8080)) return 'smart_tv';
  if (openPorts.includes(9100)) return 'printer';
  if (openPorts.includes(1883)) return 'iot_hub';
  return 'unknown';
}

/**
 * Mock manufacturer detection
 */
function detectManufacturer(mac) {
  const oui = mac.substring(0, 8).toUpperCase();
  const manufacturers = {
    'AA:BB:CC': 'Test Device',
    '00:1A:2B': 'Cisco',
    '00:50:56': 'VMware',
    'B8:27:EB': 'Raspberry Pi',
    '18:B4:30': 'Nest Labs',
    '00:0C:29': 'VMware'
  };
  return manufacturers[oui] || 'Unknown Manufacturer';
}

/**
 * Simulated port scan
 */
function scanPorts(ip) {
  const commonPorts = [21, 22, 23, 25, 53, 80, 110, 139, 443, 445, 554, 993, 1883, 3306, 5000, 5001, 8080, 8443, 9100];
  const openPorts = [];
  
  // Randomly select some ports as open
  for (const port of commonPorts) {
    if (Math.random() > 0.85) {
      openPorts.push(port);
    }
  }
  
  // Always include port 80 for routers
  if (ip.endsWith('.1') && !openPorts.includes(80)) {
    openPorts.push(80);
  }
  
  return openPorts;
}

/**
 * Simulated vulnerability scan
 */
function scanVulnerabilities(device, openPorts) {
  const vulns = [];
  
  // Check for common vulnerabilities
  if (openPorts.includes(23)) {
    vulns.push({
      id: uuidv4(),
      title: 'Telnet Service Enabled',
      severity: 'high',
      description: 'Telnet transmits data in plaintext, including passwords',
      cve_id: null,
      cvss_score: 7.5,
      remediation: 'Disable Telnet and use SSH instead'
    });
  }
  
  if (openPorts.includes(21)) {
    vulns.push({
      id: uuidv4(),
      title: 'FTP Service Detected',
      severity: 'medium',
      description: 'FTP transmits credentials in plaintext',
      cve_id: null,
      cvss_score: 5.3,
      remediation: 'Use SFTP or SCP for secure file transfer'
    });
  }
  
  if (openPorts.includes(554)) {
    if (Math.random() > 0.5) {
      vulns.push({
        id: uuidv4(),
        title: 'RTSP Stream Without Authentication',
        severity: 'critical',
        description: 'Camera RTSP stream accessible without authentication',
        cve_id: null,
        cvss_score: 9.1,
        remediation: 'Enable RTSP authentication on the camera'
      });
    }
  }
  
  // Random chance of default credentials
  if (Math.random() > 0.7) {
    vulns.push({
      id: uuidv4(),
      title: 'Default Credentials Detected',
      severity: 'critical',
      description: 'Device is using factory default username and password',
      cve_id: null,
      cvss_score: 9.8,
      remediation: 'Change default credentials immediately'
    });
  }
  
  return vulns;
}

/**
 * Calculate risk score based on vulnerabilities
 */
function calculateRiskScore(vulnerabilities) {
  if (vulnerabilities.length === 0) return 0;
  
  let score = 0;
  for (const vuln of vulnerabilities) {
    switch (vuln.severity) {
      case 'critical': score += 30; break;
      case 'high': score += 20; break;
      case 'medium': score += 10; break;
      case 'low': score += 5; break;
    }
  }
  
  return Math.min(score, 100);
}

/**
 * Get risk level from score
 */
function getRiskLevel(score) {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  if (score >= 10) return 'low';
  return 'safe';
}

/**
 * Start a network scan
 */
async function startScan(scanConfig, userId, broadcastFn) {
  const db = getDatabase();
  const scanId = uuidv4();
  
  const scan = {
    id: scanId,
    type: scanConfig.type || 'full',
    status: 'running',
    progress: 0,
    devices_scanned: 0,
    total_devices: 0,
    vulnerabilities_found: 0,
    critical_issues: 0,
    started_by: userId,
    start_time: new Date().toISOString(),
    subnet: scanConfig.subnet || '192.168.1.0/24'
  };
  
  // Store scan in database
  db.prepare(`
    INSERT INTO scans (id, type, status, progress, started_by, start_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(scanId, scan.type, 'running', 0, userId, scan.start_time);
  
  activeScans.set(scanId, scan);
  
  // Get IP range to scan
  const ips = getIPRange(scan.subnet);
  scan.total_devices = ips.length;
  
  // Update total in database
  db.prepare('UPDATE scans SET total_devices = ? WHERE id = ?').run(ips.length, scanId);
  
  // Simulate scanning in background
  processScan(scan, ips, broadcastFn);
  
  return scan;
}

/**
 * Process scan asynchronously
 */
async function processScan(scan, ips, broadcastFn) {
  const db = getDatabase();
  const now = new Date().toISOString();
  let devicesFound = 0;
  let vulnsFound = 0;
  let criticalCount = 0;
  
  for (let i = 0; i < ips.length; i++) {
    // Check if scan was cancelled
    const currentScan = activeScans.get(scan.id);
    if (!currentScan || currentScan.status === 'cancelled') {
      db.prepare('UPDATE scans SET status = ? WHERE id = ?').run('cancelled', scan.id);
      saveDatabase();
      return;
    }
    
    const ip = ips[i];
    
    // Simulate discovery (30% chance of finding a device)
    const deviceFound = Math.random() > 0.7;
    
    if (deviceFound) {
      devicesFound++;
      const mac = generateMAC();
      const openPorts = scanPorts(ip);
      const deviceType = detectDeviceType(ip, openPorts);
      const manufacturer = detectManufacturer(mac);
      
      // Check if device already exists
      const existingDevice = db.prepare('SELECT id FROM devices WHERE ip = ?').get(ip);
      
      let deviceId;
      if (existingDevice) {
        deviceId = existingDevice.id;
        // Update existing device
        db.prepare(`
          UPDATE devices SET 
            mac = ?, device_type = ?, manufacturer = ?, 
            status = 'online', last_seen = ?, updated_at = ?
          WHERE id = ?
        `).run(mac, deviceType, manufacturer, now, now, deviceId);
      } else {
        deviceId = uuidv4();
        // Insert new device
        db.prepare(`
          INSERT INTO devices (id, name, ip, mac, device_type, manufacturer, status, discovered_at, last_seen)
          VALUES (?, ?, ?, ?, ?, ?, 'online', ?, ?)
        `).run(deviceId, `Device ${ip}`, ip, mac, deviceType, manufacturer, now, now);
        
        // Create alert for new device
        db.prepare(`
          INSERT INTO alerts (id, type, severity, device_id, device_ip, message, created_at)
          VALUES (?, 'new_device', 'info', ?, ?, ?, ?)
        `).run(uuidv4(), deviceId, ip, `New device discovered: ${ip}`, now);
      }
      
      // Scan for vulnerabilities
      const vulns = scanVulnerabilities({ id: deviceId, ip }, openPorts);
      vulnsFound += vulns.length;
      
      // Insert vulnerabilities
      for (const vuln of vulns) {
        if (vuln.severity === 'critical') criticalCount++;
        
        db.prepare(`
          INSERT INTO vulnerabilities (id, device_id, title, severity, description, cve_id, cvss_score, remediation, status, discovered_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
        `).run(vuln.id, deviceId, vuln.title, vuln.severity, vuln.description, vuln.cve_id, vuln.cvss_score, vuln.remediation, now);
        
        // Create alert for critical/high vulnerabilities
        if (vuln.severity === 'critical' || vuln.severity === 'high') {
          db.prepare(`
            INSERT INTO alerts (id, type, severity, device_id, device_ip, message, created_at)
            VALUES (?, 'vulnerability', ?, ?, ?, ?, ?)
          `).run(uuidv4(), vuln.severity, deviceId, ip, `${vuln.severity.toUpperCase()}: ${vuln.title}`, now);
        }
      }
      
      // Update device risk score
      const riskScore = calculateRiskScore(vulns);
      const riskLevel = getRiskLevel(riskScore);
      db.prepare('UPDATE devices SET risk_score = ?, risk_level = ? WHERE id = ?').run(riskScore, riskLevel, deviceId);
      
      // Store open ports
      for (const port of openPorts) {
        const portService = getPortService(port);
        db.prepare(`
          INSERT OR REPLACE INTO ports (id, device_id, port_number, service_name, status)
          VALUES (?, ?, ?, ?, 'open')
        `).run(uuidv4(), deviceId, port, portService);
      }
    }
    
    // Update progress
    const progress = Math.round(((i + 1) / ips.length) * 100);
    scan.progress = progress;
    scan.devices_scanned = i + 1;
    scan.vulnerabilities_found = vulnsFound;
    scan.critical_issues = criticalCount;
    
    // Update database
    db.prepare(`
      UPDATE scans SET 
        progress = ?, devices_scanned = ?, vulnerabilities_found = ?, critical_issues = ?
      WHERE id = ?
    `).run(progress, i + 1, vulnsFound, criticalCount, scan.id);
    
    // Broadcast progress
    if (broadcastFn && progress % 5 === 0) {
      broadcastFn('scan', {
        type: 'scan_progress',
        scan: {
          id: scan.id,
          progress,
          devices_scanned: i + 1,
          total_devices: ips.length,
          vulnerabilities_found: vulnsFound,
          critical_issues: criticalCount
        }
      });
    }
    
    // Small delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Complete the scan
  const endTime = new Date().toISOString();
  scan.status = 'completed';
  scan.end_time = endTime;
  
  db.prepare(`
    UPDATE scans SET status = 'completed', end_time = ?, devices_scanned = ?, vulnerabilities_found = ?, critical_issues = ?, progress = 100
    WHERE id = ?
  `).run(endTime, devicesFound, vulnsFound, criticalCount, scan.id);
  
  activeScans.delete(scan.id);
  saveDatabase();
  
  // Broadcast completion
  if (broadcastFn) {
    broadcastFn('scan', {
      type: 'scan_complete',
      scan: {
        id: scan.id,
        status: 'completed',
        devices_found: devicesFound,
        vulnerabilities_found: vulnsFound,
        critical_issues: criticalCount
      }
    });
  }
  
  logger.info(`Scan ${scan.id} completed. Found ${devicesFound} devices, ${vulnsFound} vulnerabilities`);
}

/**
 * Get port service name
 */
function getPortService(port) {
  const services = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    139: 'NetBIOS',
    443: 'HTTPS',
    445: 'SMB',
    554: 'RTSP',
    993: 'IMAPS',
    1883: 'MQTT',
    3306: 'MySQL',
    5000: 'UPnP',
    5001: 'Synology DSM',
    8080: 'HTTP-Alt',
    8443: 'HTTPS-Alt',
    9100: 'Printer'
  };
  return services[port] || `Port ${port}`;
}

/**
 * Get scan status
 */
function getScanStatus(scanId) {
  // Check active scans first
  if (activeScans.has(scanId)) {
    return activeScans.get(scanId);
  }
  
  // Check database
  const db = getDatabase();
  const scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(scanId);
  return scan;
}

/**
 * Cancel a running scan
 */
function cancelScan(scanId) {
  const scan = activeScans.get(scanId);
  if (scan) {
    scan.status = 'cancelled';
    activeScans.set(scanId, scan);
    return true;
  }
  return false;
}

/**
 * Get scan history
 */
function getScanHistory(limit = 10) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM scans ORDER BY start_time DESC LIMIT ?
  `).all(limit);
}

module.exports = {
  startScan,
  getScanStatus,
  cancelScan,
  getScanHistory
};
