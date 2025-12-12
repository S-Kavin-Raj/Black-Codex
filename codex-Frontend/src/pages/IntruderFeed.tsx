import { Layout } from "@/components/layout/Layout";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info, Clock, Monitor, MapPin, Shield } from "lucide-react";
import { apiGet } from "@/lib/api";
import { connectSocket, sendSocketMessage, onSocketMessage } from "@/lib/socket";

interface Alert {
  id: string;
  timestamp: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  source: string;
  sourceIp: string;
  targetIp: string;
  location: string;
  status: "active" | "investigating" | "resolved";
}

const IntruderFeed = () => {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
      const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
      return matchesSeverity && matchesStatus;
    });
  }, [alerts, severityFilter, statusFilter]);

  // Fetch initial alerts
  useEffect(() => {
    let mounted = true;
    apiGet('/alerts')
      .then((data) => {
        const list = data?.alerts || data || [];
        if (mounted && Array.isArray(list)) setAlerts(list);
      })
      .catch((err) => console.error('Failed to fetch alerts', err));
    return () => { mounted = false; };
  }, []);

  // Subscribe to websocket alerts
  useEffect(() => {
    const socket = connectSocket();
    function handleMessage(ev: MessageEvent) {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'broadcast' && msg.channel === 'alerts') {
          const payload = msg.data;
          if (payload?.event === 'new_alert' && payload.alert) {
            setAlerts(prev => [payload.alert, ...prev]);
          }
          if (payload?.event === 'alert_acknowledged' && payload.alertId) {
            setAlerts(prev => prev.map(a => a.id === payload.alertId ? { ...a, status: 'resolved' } : a));
          }
        }
      } catch (e) {
        // ignore invalid messages
      }
    }

    // subscribe after open
    if (socket.readyState === WebSocket.OPEN) {
      sendSocketMessage({ type: 'subscribe', channel: 'alerts' });
    } else {
      socket.addEventListener('open', () => sendSocketMessage({ type: 'subscribe', channel: 'alerts' }), { once: true });
    }

    const off = onSocketMessage(handleMessage);
    return () => {
      off();
      try { socket.close(); } catch (e) { /* ignore */ }
    };
  }, []);

  const getSeverityIcon = (severity: Alert["severity"]) => {
    const icons = {
      critical: AlertTriangle,
      high: AlertTriangle,
      medium: AlertCircle,
      low: Info,
      info: Info,
    };
    return icons[severity];
  };

  const getSeverityStyles = (severity: Alert["severity"]) => {
    const styles = {
      critical: "bg-destructive/20 text-destructive border-destructive/50",
      high: "bg-orange-500/20 text-orange-500 border-orange-500/50",
      medium: "bg-warning/20 text-warning border-warning/50",
      low: "bg-secondary/20 text-secondary border-secondary/50",
      info: "bg-muted text-muted-foreground border-border",
    };
    return styles[severity];
  };

  const getStatusStyles = (status: Alert["status"]) => {
    const styles = {
      active: "bg-destructive/20 text-destructive",
      investigating: "bg-warning/20 text-warning",
      resolved: "bg-success/20 text-success",
    };
    return styles[status];
  };

  const severityCounts = useMemo(() => {
    return {
      critical: alerts.filter((a) => a.severity === "critical" && a.status !== "resolved").length,
      high: alerts.filter((a) => a.severity === "high" && a.status !== "resolved").length,
      medium: alerts.filter((a) => a.severity === "medium" && a.status !== "resolved").length,
      low: alerts.filter((a) => a.severity === "low" && a.status !== "resolved").length,
    };
  }, [alerts]);

  return (
    <Layout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Intruder Alert Feed
        </h1>
        <p className="text-muted-foreground">
          Real-time threat timeline with severity filtering and incident tracking
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Critical", count: severityCounts.critical, color: "text-destructive bg-destructive/10 border-destructive/30" },
          { label: "High", count: severityCounts.high, color: "text-orange-500 bg-orange-500/10 border-orange-500/30" },
          { label: "Medium", count: severityCounts.medium, color: "text-warning bg-warning/10 border-warning/30" },
          { label: "Low", count: severityCounts.low, color: "text-secondary bg-secondary/10 border-secondary/30" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={cn("glass-panel p-4 border animate-fade-in", stat.color, `ad-${i * 50}`)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm uppercase tracking-wider">{stat.label}</span>
              <span className="text-2xl font-display font-bold">{stat.count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 mb-6 flex flex-wrap gap-2 animate-fade-in ad-200">
        <div className="flex flex-wrap gap-2 mr-4">
          {["all", "critical", "high", "medium", "low", "info"].map((filter) => (
            <button
              key={filter}
              onClick={() => setSeverityFilter(filter)}
              className={cn(
                "px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition-all",
                severityFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "active", "investigating", "resolved"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={cn(
                "px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition-all border",
                statusFilter === filter
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredAlerts.map((alert, index) => {
          const Icon = getSeverityIcon(alert.severity);
          return (
            <div
              key={alert.id}
              className={cn(
                "glass-panel p-5 border-l-4 transition-all hover:translate-x-1 animate-fade-in",
                getSeverityStyles(alert.severity),
                `ad-${300 + index * 100}`
              )}
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className={cn("p-3 rounded-lg", getSeverityStyles(alert.severity))}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-display font-semibold text-foreground">
                      {alert.title}
                    </h3>
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full",
                      getStatusStyles(alert.status)
                    )}>
                      {alert.status}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {alert.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{alert.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Monitor className="w-3 h-3" />
                      <span>{alert.source}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{alert.location}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div>
                    <span className="text-muted-foreground">Source: </span>
                    <span className="font-mono text-destructive">{alert.sourceIp}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target: </span>
                    <span className="font-mono text-secondary">{alert.targetIp}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="glass-panel p-12 text-center">
          <Shield className="w-12 h-12 text-success mx-auto mb-4" />
          <p className="text-muted-foreground">No alerts match your filter criteria</p>
        </div>
      )}
    </Layout>
  );
};

export default IntruderFeed;
