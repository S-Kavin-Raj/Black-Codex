import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, AlertTriangle, Shield, Clock, Target } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { connectSocket, sendSocketMessage, onSocketMessage } from "@/lib/socket";

interface Vulnerability {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  cve?: string;
  host: string;
  port?: number;
  description: string;
}

const ScanEngine = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState("Idle");
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [deviceCount, setDeviceCount] = useState(0);
  const [portsScanned, setPortsScanned] = useState(0);

  const phases = [
    "Initializing scan engine...",
    "Discovering hosts...",
    "Port scanning...",
    "Service detection...",
    "Vulnerability analysis...",
    "CVE database lookup...",
    "Generating report...",
    "Scan complete",
  ];

  useEffect(() => {
    // Poll current scan status and subscribe to real-time scan events
    let mounted = true;
    apiGet('/scan/status')
      .then((res) => {
        const status = res?.status || res?.message || res;
        if (mounted && res) {
          if (res.progress !== undefined) setScanProgress(res.progress);
          if (res.message) setScanPhase(res.message || res.scanPhase || 'Idle');
          setIsScanning(res.status === 'running' || (res.progress && res.progress < 100));
        }
      })
      .catch(() => { });

    apiGet('/vulnerabilities')
      .then((list) => {
        if (mounted && Array.isArray(list)) setVulnerabilities(list);
      })
      .catch(() => { });

    const socket = connectSocket();
    const subscribeToChannels = () => {
      sendSocketMessage({ type: 'subscribe', channel: 'scan' });
      sendSocketMessage({ type: 'subscribe', channel: 'devices' });
    };
    if (socket.readyState === WebSocket.OPEN) {
      subscribeToChannels();
    } else {
      socket.addEventListener('open', subscribeToChannels, { once: true });
    }

    const handle = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'broadcast' && msg.channel === 'scan') {
          const payload = msg.data;
          if (payload?.type === 'scan_progress') {
            if (payload.progress !== undefined) setScanProgress(payload.progress);
            if (payload.message) setScanPhase(payload.message);
            setIsScanning(true);
          }
          if (payload?.type === 'scan_complete') {
            setScanProgress(100);
            setScanPhase('Scan complete');
            setIsScanning(false);
            // Refresh device count after scan
            apiGet('/devices')
              .then((res) => {
                const list = Array.isArray(res) ? res : res?.devices || [];
                setDeviceCount(list.length);
              })
              .catch(() => { });
          }
        }
        // devices channel reports port_scan events and new devices
        if (msg.type === 'broadcast' && msg.channel === 'devices') {
          const payload = msg.data;
          if (payload?.type === 'port_open' && payload.ip) {
            setPortsScanned(prev => prev + 1);
            setVulnerabilities(prev => [{ id: `port-${payload.ip}-${payload.port}`, name: `Open port ${payload.port} on ${payload.ip}`, severity: 'medium', host: payload.ip, port: payload.port, description: payload.service || 'Open port' }, ...prev]);
          }
          if (payload?.type === 'port_scan_completed' && payload.totalScanned) {
            setPortsScanned(prev => prev + payload.totalScanned);
          }
          if (payload?.event === 'new_device') {
            setDeviceCount(prev => prev + 1);
          }
        }
      } catch (e) { }
    };
    const off = onSocketMessage(handle);

    // Fetch devices count for stats
    apiGet('/devices')
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.devices || [];
        setDeviceCount(list.length);
      })
      .catch(() => { });

    return () => { mounted = false; off(); };
  }, []); // Empty dependency array - only subscribe once on mount

  const startScan = () => {
    // Trigger backend scan start
    setScanProgress(0);
    setVulnerabilities([]);
    setScanPhase(phases[0]);
    apiPost('/scan/start', { type: 'full' })
      .then((res) => {
        setIsScanning(true);
        if (res?.scanId) {
          setScanPhase('Initializing scan...');
        }
      })
      .catch((err) => {
        console.error('Failed to start scan', err);
        setScanPhase('Failed to start scan');
      });
  };

  const pauseScan = () => {
    setIsScanning(false);
  };

  const resetScan = () => {
    // Attempt to stop backend scan if running, then reset UI
    if (isScanning) {
      apiPost('/scan/stop', {})
        .then(() => {
          setIsScanning(false);
          setScanProgress(0);
          setVulnerabilities([]);
          setScanPhase('Idle');
        })
        .catch(() => {
          // ignore stop errors, still reset UI
          setIsScanning(false);
          setScanProgress(0);
          setVulnerabilities([]);
          setScanPhase('Idle');
        });
    } else {
      setIsScanning(false);
      setScanProgress(0);
      setVulnerabilities([]);
      setScanPhase('Idle');
    }
  };

  const getSeverityStyles = (severity: Vulnerability["severity"]) => {
    const styles = {
      critical: "bg-destructive/20 text-destructive border-destructive/50",
      high: "bg-orange-500/20 text-orange-500 border-orange-500/50",
      medium: "bg-warning/20 text-warning border-warning/50",
      low: "bg-secondary/20 text-secondary border-secondary/50",
    };
    return styles[severity];
  };

  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (scanProgress / 100) * circumference;

  return (
    <Layout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Vulnerability Scan Engine
        </h1>
        <p className="text-muted-foreground">
          Automated vulnerability detection with customizable scan profiles
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Scan Control */}
        <div className="glass-panel-glow p-8 animate-fade-in ad-100">
          <div className="flex flex-col items-center">
            {/* Circular Progress */}
            <div className="relative w-64 h-64 mb-8">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="90"
                  strokeWidth="12"
                  fill="none"
                  className="stroke-muted"
                />
                {/* Progress circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="90"
                  strokeWidth="12"
                  fill="none"
                  className={cn(
                    "transition-all duration-300",
                    scanProgress >= 100 ? "stroke-success drop-success" : "stroke-primary drop-primary"
                  )}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
                {/* Glow effect */}
                <circle
                  cx="128"
                  cy="128"
                  r="90"
                  strokeWidth="16"
                  fill="none"
                  className={cn(
                    "transition-all duration-300",
                    scanProgress >= 100 ? "stroke-success" : "stroke-primary"
                  )}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  opacity={0.2}
                />
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isScanning ? (
                  <Target className="w-12 h-12 text-primary animate-spin-slow mb-2" />
                ) : scanProgress >= 100 ? (
                  <Shield className="w-12 h-12 text-success mb-2" />
                ) : (
                  <Scan className="w-12 h-12 text-muted-foreground mb-2" />
                )}
                <span className="text-4xl font-display font-bold text-foreground">
                  {Math.round(scanProgress)}%
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                Status
              </p>
              <p className={cn(
                "font-mono text-lg",
                isScanning ? "text-primary animate-pulse" : scanProgress >= 100 ? "text-success" : "text-muted-foreground"
              )}>
                {scanPhase}
              </p>
            </div>

            {/* Controls */}
            <div className="flex gap-4">
              {!isScanning && (
                <button
                  onClick={startScan}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-display uppercase tracking-wider flex items-center gap-2 hover:bg-primary/90 transition-all neon-border"
                >
                  <Play className="w-5 h-5" />
                  {scanProgress > 0 && scanProgress < 100 ? 'Resume Scan' : 'Start Scan'}
                </button>
              )}
              {isScanning && (
                <button
                  onClick={pauseScan}
                  className="px-6 py-3 bg-warning text-warning-foreground rounded-lg font-display uppercase tracking-wider flex items-center gap-2 hover:bg-warning/90 transition-all"
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </button>
              )}
              {(scanProgress > 0 || isScanning) && (
                <button
                  onClick={resetScan}
                  className="px-6 py-3 bg-muted text-muted-foreground rounded-lg font-display uppercase tracking-wider flex items-center gap-2 hover:bg-muted/80 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scan Stats & Results */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 animate-fade-in ad-200">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{deviceCount}</p>
                  <p className="text-xs text-muted-foreground uppercase">Hosts Found</p>
                </div>
              </div>
            </div>
            <div className="glass-panel p-4 animate-fade-in ad-250">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-destructive" />
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{vulnerabilities.length}</p>
                  <p className="text-xs text-muted-foreground uppercase">Vulnerabilities</p>
                </div>
              </div>
            </div>
            <div className="glass-panel p-4 animate-fade-in ad-300">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-secondary" />
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">4:32</p>
                  <p className="text-xs text-muted-foreground uppercase">Est. Time Left</p>
                </div>
              </div>
            </div>
            <div className="glass-panel p-4 animate-fade-in ad-350">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-success" />
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{portsScanned}</p>
                  <p className="text-xs text-muted-foreground uppercase">Ports Checked</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vulnerabilities Found */}
          <div className="glass-panel p-6 animate-fade-in ad-400">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">
              Vulnerabilities Detected
            </h3>

            {vulnerabilities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {scanProgress > 0 ? "Scanning for vulnerabilities..." : "Start a scan to detect vulnerabilities"}
              </div>
            ) : (
              <div className="space-y-3">
                {vulnerabilities.map((vuln, index) => (
                  <div
                    key={vuln.id}
                    className={cn(
                      "p-4 rounded-lg border animate-fade-in",
                      getSeverityStyles(vuln.severity),
                      `ad-${index * 100}`
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{vuln.name}</h4>
                      <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-background/50">
                        {vuln.severity}
                      </span>
                    </div>
                    <p className="text-sm opacity-80 mb-2">{vuln.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs opacity-70">
                      {vuln.cve && <span className="font-mono">{vuln.cve}</span>}
                      <span className="font-mono">{vuln.host}:{vuln.port}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Add missing Scan icon component
const Scan = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);

export default ScanEngine;
