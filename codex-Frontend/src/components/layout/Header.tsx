import { Shield, Bell, Settings, User, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/topology", label: "Topology" },
  { href: "/inventory", label: "Inventory" },
  { href: "/intruder-feed", label: "Alerts" },
  { href: "/scan-engine", label: "Scanner" },
  { href: "/ai-report", label: "AI Analyst" },
  { href: "/quarantine", label: "Quarantine" },
  { href: "/admin-center", label: "Admin" },
];

export const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/50 rounded-none">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-primary transition-all duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-display font-bold tracking-wider text-foreground">
                BLACK CODEX
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground -mt-0.5">
                Cyber Defense
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "px-3 py-2 text-xs uppercase tracking-wider transition-all duration-300 rounded-md",
                  location.pathname === item.href
                    ? "text-primary bg-primary/10 neon-text"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg transition-colors hover:bg-muted/50 group">
              <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-muted/50 group hidden sm:block">
              <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-muted/50 group hidden sm:block">
              <User className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
            </button>
            
            {/* Mobile menu button */}
            <button 
              className="lg:hidden p-2 rounded-lg transition-colors hover:bg-muted/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 text-xs uppercase tracking-wider transition-all duration-300 rounded-md text-center",
                    location.pathname === item.href
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
