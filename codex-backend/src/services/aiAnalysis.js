/**
 * AI Analysis & Remediation Suggestion Service
 * Uses Google Gemini AI for explainability and vulnerability analysis
 */
const { getDatabase } = require('../database/init');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const logger = require('../utils/logger');

// Google Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA5iXPWGGjL_ayT5sjjs6lpeaI84tsaEa4';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Call Google Gemini AI Engine
 */
async function callAIEngine(prompt) {
  try {
    logger.info('[AI] Calling Gemini AI...');

    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await res.json();

    // Extract text from Gemini response
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const responseText = data.candidates[0].content.parts[0].text;
      logger.info('[AI] Gemini response received successfully');
      return responseText;
    } else if (data.error) {
      logger.error(`[AI] Gemini API error: ${data.error.message}`);
      throw new Error(data.error.message);
    } else {
      logger.warn('[AI] Unexpected Gemini response format');
      throw new Error('Unexpected response format from Gemini');
    }
  } catch (err) {
    logger.error(`[AI] Engine call failed: ${err.message}`);
    // Fallback for demo/offline mode so the user sees the feature working
    const portsMatch = prompt.match(/Open Ports: (.*)/);
    const ports = portsMatch ? portsMatch[1] : 'unknown ports';

    return `**Security Analysis (Offline Mode)**

⚠️ AI service temporarily unavailable. Here are general security recommendations:

**Immediate Actions:**
1. **Review Open Ports**: Ports ${ports} were detected. Close any that are not essential.
2. **Update Firmware/Software**: Check vendor website for security patches.
3. **Change Default Credentials**: Ensure all default passwords have been changed.
4. **Enable Firewall**: Block unnecessary incoming connections.

**Medium Priority:**
5. **Enable Encryption**: Use HTTPS/TLS for all web services.
6. **Implement Network Segmentation**: Isolate IoT devices from main network.
7. **Regular Monitoring**: Set up alerts for unusual activity.

**Summary:** This device has potential security risks due to exposed services. Immediate review and hardening is recommended to prevent unauthorized access.`;
  }
}

/**
 * Analyze a device and generate AI-powered remediation suggestions
 */
async function analyzeDevice(ip) {
  const db = getDatabase();
  const device = db.prepare('SELECT * FROM devices WHERE ip = ?').get(ip);
  if (!device) throw new Error('Device not found');

  const ports = device.open_ports ? JSON.parse(device.open_ports) : [];
  const vulns = db.prepare('SELECT * FROM vulnerabilities WHERE device_id = ?').all(device.id);
  const misconfigs = db.prepare('SELECT * FROM misconfigurations WHERE device_id = ?').all(device.id);

  // Build detailed prompt for Gemini
  const prompt = `You are a cybersecurity expert analyzing an IoT/network device for vulnerabilities.

**Device Information:**
- Name: ${device.name || 'Unknown'}
- IP Address: ${device.ip}
- Type: ${device.device_type || device.type || 'Unknown'}
- Vendor/Manufacturer: ${device.vendor || device.manufacturer || 'Unknown'}
- MAC Address: ${device.mac || 'Unknown'}
- Risk Score: ${device.risk_score || 'Not calculated'}

**Open Ports Detected:** ${ports.length > 0 ? ports.map(p => typeof p === 'object' ? `${p.port} (${p.service || 'unknown'})` : p).join(', ') : 'None detected'}

**Known Vulnerabilities:** ${vulns.length > 0 ? vulns.map(v => v.title || v.cve_id || 'Unknown').join(', ') : 'None recorded'}

**Misconfigurations:** ${misconfigs.length > 0 ? misconfigs.map(m => m.title).join(', ') : 'None recorded'}

Please provide:
1. **Risk Assessment**: Overall risk level (Critical/High/Medium/Low) with explanation
2. **Vulnerability Analysis**: Explain each security concern found
3. **Remediation Steps**: Numbered list of specific actions to fix each issue
4. **Priority Order**: Which fixes should be done first
5. **How-To Links**: General guidance or search terms to find solutions

Format your response clearly with headers and bullet points.`;

  const aiResult = await callAIEngine(prompt);
  const summary = aiResult.split('\n').slice(0, 3).join(' ').substring(0, 200) + '...';

  // Save report to database
  const reportId = uuidv4();
  db.prepare(`
    INSERT INTO ai_reports (id, device_id, ip, analysis_type, report_data, summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    reportId,
    device.id,
    ip,
    'device',
    aiResult,
    summary,
    new Date().toISOString()
  );

  logger.info(`[AI] Report generated for device ${ip}, reportId: ${reportId}`);
  return { reportId, summary, fullReport: aiResult };
}

/**
 * Get a previously generated AI report
 */
function getReport(reportId) {
  const db = getDatabase();
  const report = db.prepare('SELECT * FROM ai_reports WHERE id = ?').get(reportId);
  return report;
}

module.exports = {
  analyzeDevice,
  getReport,
  callAIEngine
};
