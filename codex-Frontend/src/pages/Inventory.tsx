import { Layout } from "@/components/layout/Layout";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, Filter, ArrowUpDown, ChevronDown } from "lucide-react";
import { apiGet } from "@/lib/api";
import { connectSocket, sendSocketMessage, onSocketMessage } from "@/lib/socket";

interface Device {
  id: string;
  name: string;
  type: string;
  ip: string;
  mac: string;
  vendor: string;
  os: string;
  riskScore: number;
  lastSeen: string;
  status: "active" | "inactive" | "quarantined";
}

// devices will be fetched from backend

const Inventory = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof Device>("riskScore");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    let mounted = true;
    apiGet('/devices')
      .then((data) => {
        const list = data?.devices || data || [];
        if (mounted && Array.isArray(list)) setDevices(list);
      })
      .catch((err) => console.error('Failed to fetch devices', err));

    // subscribe to device updates
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

  const filteredDevices = useMemo(() => {
    return devices
      .filter((device) => {
        const matchesSearch = 
          device.name.toLowerCase().includes(search.toLowerCase()) ||
          device.ip.includes(search) ||
          device.mac.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "all" || device.type === typeFilter;
        const matchesStatus = statusFilter === "all" || device.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortOrder === "asc" 
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
  }, [search, sortBy, sortOrder, typeFilter, statusFilter]);

  const getRiskBarColor = (score: number) => {
    if (score >= 80) return "bg-destructive";
    if (score >= 50) return "bg-orange-500";
    if (score >= 30) return "bg-warning";
    return "bg-success";
  };

  const handleSort = (column: keyof Device) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const uniqueTypes = [...new Set(devices.map((d) => d.type))];

  return (
    <Layout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Device Inventory
        </h1>
        <p className="text-muted-foreground">
          Complete asset database with risk assessment and vendor information
        </p>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 mb-6 animate-fade-in ad-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, IP, or MAC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter devices by type"
              className="pl-10 pr-8 py-2 bg-input border border-border rounded-md text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter devices by status"
              className="pl-4 pr-8 py-2 bg-input border border-border rounded-md text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="quarantined">Quarantined</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden animate-fade-in ad-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                {[
                  { key: "name", label: "Device Name" },
                  { key: "type", label: "Type" },
                  { key: "ip", label: "IP Address" },
                  { key: "vendor", label: "Vendor" },
                  { key: "os", label: "OS" },
                  { key: "riskScore", label: "Risk Score" },
                  { key: "lastSeen", label: "Last Seen" },
                  { key: "status", label: "Status" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key as keyof Device)}
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device, index) => (
                <tr
                  key={device.id}
                  className={cn(
                    "border-b border-border/30 hover:bg-muted/20 transition-colors animate-fade-in",
                    `ad-${300 + index * 50}`
                  )}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{device.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{device.type}</td>
                  <td className="px-4 py-3 font-mono text-sm text-secondary">{device.ip}</td>
                  <td className="px-4 py-3 text-muted-foreground">{device.vendor}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{device.os}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            getRiskBarColor(device.riskScore),
                            `w-[${device.riskScore}%]`
                          )}
                        />
                      </div>
                      <span className="text-xs font-mono">{device.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{device.lastSeen}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 text-xs uppercase tracking-wider rounded-full",
                      device.status === "active" && "bg-success/20 text-success",
                      device.status === "inactive" && "bg-muted text-muted-foreground",
                      device.status === "quarantined" && "bg-destructive/20 text-destructive"
                    )}>
                      {device.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDevices.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No devices match your search criteria
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inventory;
