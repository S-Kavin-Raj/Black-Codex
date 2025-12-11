/**
 * AI Analysis & Remediation Suggestion Service
 * Uses GPT-4 or local LLM (Ollama) for explainability
 */
const { getDatabase } = require('../database/init');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const logger = require('../utils/logger');

// Example: Use OpenAI API or local Ollama
const OPENAI_API_URL = process.env.OPENAI_API_URL || 'http://localhost:11434/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

async function callAIEngine(prompt) {
  // Use local Ollama or OpenAI
  try {
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OPENAI_API_KEY ? { 'Authorization': `Bearer ${OPENAI_API_KEY}` } : {})
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 512,
        temperature: 0.2
      })
    });
    const data = await res.json();
    // OpenAI: data.choices[0].message.content
    // Ollama: data.message.content
    return data.choices?.[0]?.message?.content || data.message?.content || '';
  } catch (err) {
    logger.error(`[AI] Engine call failed: ${err.message}`);
    return 'AI analysis unavailable.';
  }
}

async function analyzeDevice(ip) {
  const db = getDatabase();
  const device = db.prepare('SELECT * FROM devices WHERE ip = ?').get(ip);
  if (!device) throw new Error('Device not found');
  const ports = device.open_ports ? JSON.parse(device.open_ports) : [];
  const vulns = db.prepare('SELECT * FROM vulnerabilities WHERE device_id = ?').all(device.id);
  const misconfigs = db.prepare('SELECT * FROM misconfigurations WHERE device_id = ?').all(device.id);

  // Build prompt
  const prompt = `You are a cybersecurity expert. Given the following device info, open ports, vulnerabilities, and misconfigurations, provide short actionable remediation steps, priority, and simple how-to links.\n\nDevice: ${device.name} (${device.ip})\nType: ${device.type}\nVendor: ${device.vendor}\nOpen Ports: ${ports.map(p => p.port || p).join(', ')}\nVulnerabilities: ${vulns.map(v => v.title || v.cve_id).join(', ')}\nMisconfigurations: ${misconfigs.map(m => m.title).join(', ')}\n\nOutput format:\n- Priority list of remediation steps\n- For each, a short how-to link\n- Summary paragraph`;

  const aiResult = await callAIEngine(prompt);
  const summary = aiResult.split('\n').slice(0, 2).join(' ');

  // Save report
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
  return { reportId, summary };
}

function getReport(reportId) {
  const db = getDatabase();
  const report = db.prepare('SELECT * FROM ai_reports WHERE id = ?').get(reportId);
  return report;
}

module.exports = {
  analyzeDevice,
  getReport
};
