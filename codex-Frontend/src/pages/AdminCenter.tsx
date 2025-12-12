import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Key, ExternalLink, Server, Router, Shield, Database, Wifi, Lock, Eye, EyeOff } from "lucide-react";
import { apiGet } from "@/lib/api";
import { connectSocket, sendSocketMessage, onSocketMessage } from "@/lib/socket";

interface AdminDevice {
  id: string;
  name: string;
  type: "server" | "router" | "firewall" | "database" | "switch";
  ip: string;
  adminUrl: string;
  protocol: string;
  lastAccess: string;
  status: "online" | "offline" | "maintenance";
}

// Admin devices will be fetched from backend

const AdminCenter = () => {
  const [showCredentials, setShowCredentials] = useState<string | null>(null);
  const [adminDevices, setAdminDevices] = useState<AdminDevice[]>([]);

  useEffect(() => {
    let mounted = true;
    apiGet('/devices')
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.devices || [];
        if (!mounted) return;
        // pick devices that have adminUrl or are common admin types
        const admins = (list || []).filter((d: any) => d.admin_url || ['firewall','router','server','database','switch'].includes(d.type)).map((d: any) => ({
          id: d.id || d.ip,
          name: d.name || d.ip,
          type: d.type || 'server',
          ip: d.ip || '',
          adminUrl: d.admin_url || d.adminUrl || '',
          protocol: d.admin_protocol || 'HTTPS',
          lastAccess: d.last_seen || 'unknown',
          status: d.status || 'offline'
        }));
        setAdminDevices(admins);
      })
      .catch(() => {});

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
          if (payload?.event === 'device_updated' && payload.device) {
            setAdminDevices(prev => prev.map(d => d.id === payload.device.id ? { ...d, status: payload.device.status || d.status } : d));
          }
          if (payload?.event === 'new_device' && payload.device) {
            const d = payload.device;
            if (d.admin_url || ['firewall','router','server','database','switch'].includes(d.type)) {
              setAdminDevices(prev => [{ id: d.id || d.ip, name: d.name || d.ip, type: d.type || 'server', ip: d.ip || '', adminUrl: d.admin_url || '', protocol: d.admin_protocol || 'HTTPS', lastAccess: d.last_seen || '', status: d.status || 'online' }, ...prev]);
            }
          }
        }
      } catch (e) {}
    };
    const off = onSocketMessage(handle);
    return () => { mounted = false; off(); };
  }, []);

  const getDeviceIcon = (type: AdminDevice["type"]) => {
    const icons = {
      server: Server,
      router: Router,
      firewall: Shield,
      database: Database,
      switch: Wifi,
    };
    return icons[type];
  };

  const getStatusStyles = (status: AdminDevice["status"]) => {
    const styles = {
      online: "bg-success/20 text-success",
      offline: "bg-muted text-muted-foreground",
      maintenance: "bg-warning/20 text-warning",
    };
    return styles[status];
  };

  return (
    <Layout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Admin Login Center
        </h1>
        <p className="text-muted-foreground">
          Centralized device administration portal with secure access
        </p>
      </div>

      {/* Security Notice */}
      <div className="glass-panel p-4 mb-6 border border-warning/30 animate-fade-in ad-100">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-warning" />
          <p className="text-sm text-warning">
            All admin access is logged and monitored. Use strong authentication and follow security protocols.
          </p>
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminDevices.map((device, index) => {
          const Icon = getDeviceIcon(device.type);
          return (
            <div
              key={device.id}
              className={cn(
                "glass-panel p-6 hover:border-primary/50 transition-all group animate-fade-in",
                `ad-${200 + index * 50}`
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "p-3 rounded-lg",
                  device.status === "online" && "bg-primary/20 text-primary",
                  device.status === "offline" && "bg-muted text-muted-foreground",
                  device.status === "maintenance" && "bg-warning/20 text-warning"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={cn(
                  "px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full",
                  getStatusStyles(device.status)
                )}>
                  {device.status}
                </span>
              </div>

              <h3 className="text-lg font-display font-semibold text-foreground mb-1">
                {device.name}
              </h3>
              <p className="text-sm font-mono text-secondary mb-4">{device.ip}</p>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Protocol</span>
                  <span className="text-foreground">{device.protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Access</span>
                  <span className="text-foreground">{device.lastAccess}</span>
                </div>
              </div>

              {/* Credentials (Demo) */}
              <div className="p-3 rounded-lg bg-muted/30 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Credentials
                  </span>
                  <button
                    onClick={() => setShowCredentials(showCredentials === device.id ? null : device.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCredentials === device.id ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {showCredentials === device.id ? (
                  <div className="space-y-1 text-xs font-mono">
                    <p><span className="text-muted-foreground">User:</span> admin</p>
                    <p><span className="text-muted-foreground">Pass:</span> ********</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Click eye to reveal</p>
                )}
              </div>

              <a
                href={device.adminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-display uppercase tracking-wider text-sm transition-all",
                  device.status === "online"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 neon-border"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                onClick={(e) => device.status !== "online" && e.preventDefault()}
              >
                <Key className="w-4 h-4" />
                Access Admin
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          );
        })}
      </div>

      {/* Quick SSH Access */}
      <div className="mt-8 glass-panel p-6 animate-fade-in ad-500">
        <h3 className="text-lg font-display font-semibold text-foreground mb-4">
          Quick SSH Access
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminDevices.filter(d => d.protocol.includes("SSH") && d.status === "online").map((device) => (
            <div
              key={device.id}
              className="p-4 rounded-lg bg-muted/30 border border-border/50 font-mono text-sm"
            >
              <p className="text-muted-foreground mb-2"># {device.name}</p>
              <p className="text-secondary">ssh admin@{device.ip}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AdminCenter;
