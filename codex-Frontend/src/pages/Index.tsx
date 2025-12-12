import { Layout } from "@/components/layout/Layout";
import { SecurityGauge } from "@/components/ui/SecurityGauge";
import { StatCard } from "@/components/ui/StatCard";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api";
import { connectSocket, sendSocketMessage, onSocketMessage } from "@/lib/socket";
import {
  Network,
  Server,
  AlertTriangle,
  Scan,
  Brain,
  ShieldOff,
  Key,
  Shield,
  Wifi,
  HardDrive,
  Activity,
} from "lucide-react";

const Index = () => {
  const [deviceCount, setDeviceCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [threatCount, setThreatCount] = useState(0);
  const [securityScore, setSecurityScore] = useState(85);

  useEffect(() => {
    let mounted = true;

    // Fetch devices count
    apiGet('/devices')
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.devices || [];
        if (mounted) setDeviceCount(list.length);
      })
      .catch(() => { });

    // Fetch alerts count (critical ones)
    apiGet('/alerts')
      .then((res) => {
        const list = res?.alerts || res || [];
        if (mounted && Array.isArray(list)) {
          const critical = list.filter((a: any) =>
            (a.severity === 'critical' || a.severity === 'high') && a.status !== 'resolved'
          ).length;
          setAlertCount(critical);
        }
      })
      .catch(() => { });

    // Fetch threats count
    apiGet('/threats')
      .then((res) => {
        const list = res?.threats || res || [];
        if (mounted && Array.isArray(list)) setThreatCount(list.length);
      })
      .catch(() => setThreatCount(0));

    // Fetch security score
    apiGet('/scan/security/score')
      .then((res) => {
        if (mounted && res?.score !== undefined) setSecurityScore(res.score);
      })
      .catch(() => { });

    // Subscribe to WebSocket for live updates
    const socket = connectSocket();
    const subscribe = () => {
      sendSocketMessage({ type: 'subscribe', channel: 'devices' });
      sendSocketMessage({ type: 'subscribe', channel: 'alerts' });
    };
    if (socket.readyState === WebSocket.OPEN) {
      subscribe();
    } else {
      socket.addEventListener('open', subscribe, { once: true });
    }

    const handle = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'broadcast') {
          if (msg.channel === 'devices' && msg.data?.event === 'new_device') {
            setDeviceCount(prev => prev + 1);
          }
          if (msg.channel === 'alerts' && msg.data?.event === 'new_alert') {
            const a = msg.data.alert;
            if (a?.severity === 'critical' || a?.severity === 'high') {
              setAlertCount(prev => prev + 1);
            }
          }
        }
      } catch (e) { }
    };
    const off = onSocketMessage(handle);

    return () => { mounted = false; off(); };
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="mb-12 animate-fade-in">
        <div className="glass-panel-glow p-8 relative overflow-hidden">
          <div className="scan-line" />

          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">
                System Status: Online
              </p>
              <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
                Cyber Defense
                <br />
                <span className="neon-text text-primary">Command Center</span>
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto lg:mx-0">
                Real-time network monitoring, threat detection, and automated
                security response for your digital infrastructure.
              </p>
            </div>

            <div className="flex-shrink-0">
              <SecurityGauge score={securityScore} size={220} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="animate-fade-in ad-100">
            <StatCard
              title="Active Devices"
              value={deviceCount}
              subtitle="Discovered on network"
              icon={Server}
              trend="up"
              trendValue={deviceCount > 0 ? `${deviceCount} found` : "Scanning..."}
              variant="success"
            />
          </div>
          <div className="animate-fade-in ad-200">
            <StatCard
              title="Network Traffic"
              value="Live"
              subtitle="Real-time monitoring"
              icon={Wifi}
              trend="neutral"
              trendValue="Active"
            />
          </div>
          <div className="animate-fade-in ad-300">
            <StatCard
              title="Threats Detected"
              value={threatCount}
              subtitle="From threat feeds"
              icon={Shield}
              trend={threatCount > 0 ? "up" : "neutral"}
              trendValue={threatCount > 0 ? `${threatCount} active` : "Clear"}
              variant="warning"
            />
          </div>
          <div className="animate-fade-in ad-400">
            <StatCard
              title="Critical Alerts"
              value={alertCount}
              subtitle="Requires attention"
              icon={AlertTriangle}
              trend={alertCount > 0 ? "up" : "down"}
              trendValue={alertCount > 0 ? "Action needed" : "All clear"}
              variant="danger"
            />
          </div>
        </div>
      </section>


      {/* Feature Cards Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Security Modules
            </h2>
            <p className="text-sm text-muted-foreground">
              Access all defense systems and monitoring tools
            </p>
          </div>
          <Activity className="w-6 h-6 text-primary animate-pulse-slow" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="animate-fade-in ad-100">
            <FeatureCard
              title="Network Topology"
              description="Interactive visualization of all connected nodes and their security status"
              icon={Network}
              href="/topology"
              variant="primary"
            />
          </div>
          <div className="animate-fade-in ad-150">
            <FeatureCard
              title="Device Inventory"
              description="Complete database of hardware assets with risk assessment and vendor data"
              icon={HardDrive}
              href="/inventory"
              variant="secondary"
            />
          </div>
          <div className="animate-fade-in ad-200">
            <FeatureCard
              title="Intruder Alert Feed"
              description="Real-time threat timeline with severity filtering and incident tracking"
              icon={AlertTriangle}
              href="/intruder-feed"
              variant="danger"
              badge="3 Active"
            />
          </div>
          <div className="animate-fade-in ad-250">
            <FeatureCard
              title="Scan Engine"
              description="Automated vulnerability detection with customizable scan profiles"
              icon={Scan}
              href="/scan-engine"
              variant="primary"
            />
          </div>
          <div className="animate-fade-in ad-300">
            <FeatureCard
              title="AI Security Analyst"
              description="Machine learning powered threat analysis and recommendations"
              icon={Brain}
              href="/ai-report"
              variant="accent"
              badge="Beta"
            />
          </div>
          <div className="animate-fade-in ad-350">
            <FeatureCard
              title="Quarantine Kill Switch"
              description="Emergency network isolation with comprehensive audit logging"
              icon={ShieldOff}
              href="/quarantine"
              variant="danger"
            />
          </div>
          <div className="animate-fade-in ad-400">
            <FeatureCard
              title="Admin Login Center"
              description="Centralized device administration portal with secure access"
              icon={Key}
              href="/admin-center"
              variant="secondary"
            />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
