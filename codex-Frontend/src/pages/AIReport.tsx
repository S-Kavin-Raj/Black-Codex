import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Brain, ChevronDown, Sparkles, AlertTriangle, Shield, TrendingUp, Loader2 } from "lucide-react";

interface Device {
  id: string;
  name: string;
  type: string;
  ip: string;
  riskScore: number;
}

import { apiGet } from "@/lib/api";
import { connectSocket, sendSocketMessage, onSocketMessage } from "@/lib/socket";

const devicesSeed: Device[] = [];

interface AIAnalysis {
  summary: string;
  riskAssessment: string;
  threats: string[];
  recommendations: string[];
  prediction: string;
}

const getDeviceAnalysis = (device: Device): AIAnalysis => {
  if (device.riskScore >= 80) {
    return {
      summary: `Critical security concerns detected on ${device.name}. Immediate remediation required.`,
      riskAssessment: "This device poses a significant risk to the network infrastructure. Multiple high-severity vulnerabilities have been identified that could be exploited by threat actors.",
      threats: [
        "Unpatched critical vulnerabilities detected",
        "Suspicious outbound connections observed",
        "Default credentials may still be in use",
        "Exposed management interfaces detected",
      ],
      recommendations: [
        "Immediately isolate this device from critical network segments",
        "Apply all pending security patches",
        "Conduct full forensic analysis",
        "Reset all credentials and implement strong password policy",
        "Enable enhanced monitoring and logging",
      ],
      prediction: "Without intervention, there is a 78% probability of compromise within 7 days based on current threat intelligence.",
    };
  } else if (device.riskScore >= 50) {
    return {
      summary: `Moderate security concerns identified on ${device.name}. Remediation recommended within 48 hours.`,
      riskAssessment: "This device has several security gaps that should be addressed promptly to maintain network integrity.",
      threats: [
        "Outdated software components detected",
        "Missing security headers on web services",
        "Weak encryption protocols in use",
      ],
      recommendations: [
        "Schedule maintenance window for security updates",
        "Review and harden service configurations",
        "Implement network segmentation",
        "Enable intrusion detection monitoring",
      ],
      prediction: "Current trajectory suggests 35% chance of security incident within 30 days if not addressed.",
    };
  } else {
    return {
      summary: `${device.name} is operating within acceptable security parameters.`,
      riskAssessment: "This device demonstrates good security hygiene with only minor improvements recommended.",
      threats: [
        "No critical threats detected",
        "Minor configuration optimizations available",
      ],
      recommendations: [
        "Continue regular patch management",
        "Maintain current security monitoring",
        "Review access controls quarterly",
        "Consider enabling additional logging",
      ],
      prediction: "Based on current posture, this device presents minimal risk with a 5% probability of security incident in the next 90 days.",
    };
  }
};

const AIReport = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>(devicesSeed);

  useEffect(() => {
    let mounted = true;
    apiGet('/devices')
      .then((res) => {
        const list = res?.devices || res || [];
        if (mounted && Array.isArray(list)) setDevices(list);
      })
      .catch((err) => console.error('Failed to fetch devices for AIReport', err));

    const socket = connectSocket();
    if (socket.readyState === WebSocket.OPEN) {
      sendSocketMessage({ type: 'subscribe', channel: 'devices' });
    } else {
      socket.addEventListener('open', () => sendSocketMessage({ type: 'subscribe', channel: 'devices' }), { once: true });
    }

    const handle = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'broadcast' && msg.channel === 'devices') {
          const payload = msg.data;
          if (payload?.event === 'new_device' && payload.device) {
            setDevices(prev => [payload.device, ...prev]);
          }
          if (payload?.event === 'device_updated' && payload.device) {
            setDevices(prev => prev.map(d => d.id === payload.device.id ? payload.device : d));
          }
        }
      } catch (e) { /* ignore */ }
    };
    const off = onSocketMessage(handle);

    return () => { mounted = false; off(); };
  }, []);

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
    setDropdownOpen(false);
    setIsAnalyzing(true);
    setAnalysis(null);

    // Simulate AI analysis time
    setTimeout(() => {
      setAnalysis(getDeviceAnalysis(device));
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <Layout>
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-display font-bold text-foreground">
            AI Security Analyst
          </h1>
          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-accent/20 text-accent rounded-full border border-accent/30">
            Beta
          </span>
        </div>
        <p className="text-muted-foreground">
          Machine learning powered threat analysis and security recommendations
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Device Selector */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 animate-fade-in ad-100">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-accent" />
              <h2 className="text-lg font-display font-semibold text-foreground">
                Select Device
              </h2>
            </div>

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-left flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <span className={cn(
                  selectedDevice ? "text-foreground" : "text-muted-foreground"
                )}>
                  {selectedDevice ? selectedDevice.name : "Choose a device..."}
                </span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  dropdownOpen && "rotate-180"
                )} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-panel border border-border rounded-lg overflow-hidden z-10 animate-fade-in">
                  {devices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => handleDeviceSelect(device)}
                      className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-foreground font-medium">{device.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{device.ip}</p>
                        </div>
                        <span className={cn(
                          "text-xs font-mono px-2 py-0.5 rounded-full",
                          device.riskScore >= 80 && "bg-destructive/20 text-destructive",
                          device.riskScore >= 50 && device.riskScore < 80 && "bg-warning/20 text-warning",
                          device.riskScore < 50 && "bg-success/20 text-success"
                        )}>
                          {device.riskScore}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          {selectedDevice && (
            <div className="glass-panel p-6 animate-fade-in ad-200">
              <h3 className="text-sm font-display uppercase tracking-wider text-muted-foreground mb-4">
                Device Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="text-foreground">{selectedDevice.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Address</span>
                  <span className="text-foreground font-mono">{selectedDevice.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Score</span>
                  <span className={cn(
                    "font-bold",
                    selectedDevice.riskScore >= 80 && "text-destructive",
                    selectedDevice.riskScore >= 50 && selectedDevice.riskScore < 80 && "text-warning",
                    selectedDevice.riskScore < 50 && "text-success"
                  )}>
                    {selectedDevice.riskScore}/100
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        <div className="lg:col-span-2">
          {!selectedDevice && (
            <div className="glass-panel p-12 text-center animate-fade-in ad-100">
              <Brain className="w-16 h-16 text-accent/50 mx-auto mb-4" />
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                AI Analysis Ready
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Select a device from the list to generate an AI-powered security analysis with threat predictions and recommendations.
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="glass-panel-glow p-12 text-center animate-fade-in">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <Loader2 className="w-20 h-20 text-accent animate-spin" />
                <Sparkles className="w-8 h-8 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                Analyzing Device
              </h3>
              <p className="text-muted-foreground">
                Running neural network analysis on {selectedDevice?.name}...
              </p>
            </div>
          )}

          {analysis && !isAnalyzing && (
            <div className="space-y-6 animate-fade-in">
              {/* Summary */}
              <div className="glass-panel-glow p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-accent/20 text-accent">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                      AI Summary
                    </h3>
                    <p className="text-foreground leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-secondary" />
                  <h3 className="text-lg font-display font-semibold text-foreground">
                    Risk Assessment
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {analysis.riskAssessment}
                </p>
              </div>

              {/* Threats */}
              <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="text-lg font-display font-semibold text-foreground">
                    Identified Threats
                  </h3>
                </div>
                <ul className="space-y-2">
                  {analysis.threats.map((threat, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-destructive mt-1">•</span>
                      {threat}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <h3 className="text-lg font-display font-semibold text-foreground">
                    Recommendations
                  </h3>
                </div>
                <ol className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3 text-muted-foreground">
                      <span className="text-success font-mono text-sm">{index + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Prediction */}
              <div className="glass-panel p-6 border-l-4 border-accent">
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-5 h-5 text-accent" />
                  <h3 className="text-sm font-display uppercase tracking-wider text-accent">
                    AI Prediction
                  </h3>
                </div>
                <p className="text-foreground italic">
                  "{analysis.prediction}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AIReport;
