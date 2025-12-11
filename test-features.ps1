# Black Codex Feature Test Script
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   BLACK CODEX - FEATURE STATUS CHECK" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001/api"

# Test 1: Real Network Scan (ARP Discovery)
Write-Host "1. REAL NETWORK SCAN (ARP Discovery)" -ForegroundColor Yellow
Write-Host "   Source: Live ARP table from your network" -ForegroundColor DarkGray
try {
    $r = (Invoke-WebRequest -Uri "$baseUrl/scan/devices" -UseBasicParsing -TimeoutSec 30).Content | ConvertFrom-Json
    Write-Host "   [REAL DATA] Found $($r.count) devices:" -ForegroundColor Green
    $r.devices | ForEach-Object { 
        Write-Host "     - $($_.ip) | $($_.vendor) | $($_.status)" -ForegroundColor White 
    }
} catch {
    Write-Host "   [ERROR] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Network Info
Write-Host "`n2. NETWORK INTERFACE INFO" -ForegroundColor Yellow
Write-Host "   Source: Your actual network adapters" -ForegroundColor DarkGray
try {
    $r = (Invoke-WebRequest -Uri "$baseUrl/scan/network-info" -UseBasicParsing -TimeoutSec 10).Content | ConvertFrom-Json
    Write-Host "   [REAL DATA] Network interfaces:" -ForegroundColor Green
    $r.interfaces | ForEach-Object { 
        Write-Host "     - $($_.interface): $($_.ip) ($($_.subnet))" -ForegroundColor White 
    }
} catch {
    Write-Host "   [ERROR] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Port Scan
Write-Host "`n3. REAL PORT SCAN" -ForegroundColor Yellow
Write-Host "   Source: TCP connection attempts to router" -ForegroundColor DarkGray
try {
    $r = (Invoke-WebRequest -Uri "$baseUrl/scan/ports/192.168.29.1" -UseBasicParsing -TimeoutSec 60).Content | ConvertFrom-Json
    Write-Host "   [REAL DATA] Open ports on router:" -ForegroundColor Green
    $r.openPorts | ForEach-Object { 
        Write-Host "     - Port $($_.port): $($_.service)" -ForegroundColor White 
    }
} catch {
    Write-Host "   [ERROR] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Alerts
Write-Host "`n4. SECURITY ALERTS" -ForegroundColor Yellow
Write-Host "   Source: Database (demo data + scan findings)" -ForegroundColor DarkGray
try {
    $r = (Invoke-WebRequest -Uri "$baseUrl/alerts" -UseBasicParsing -TimeoutSec 10).Content | ConvertFrom-Json
    Write-Host "   [MIXED] $($r.alerts.Count) alerts in database:" -ForegroundColor Green
    $r.alerts | Select-Object -First 3 | ForEach-Object { 
        Write-Host "     - [$($_.severity)] $($_.message.Substring(0, [Math]::Min(60, $($_.message.Length))))..." -ForegroundColor White 
    }
} catch {
    Write-Host "   [ERROR] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Devices from DB
Write-Host "`n5. DEVICE INVENTORY (Database)" -ForegroundColor Yellow
Write-Host "   Source: SQLite database" -ForegroundColor DarkGray
try {
    $r = (Invoke-WebRequest -Uri "$baseUrl/devices" -UseBasicParsing -TimeoutSec 10).Content | ConvertFrom-Json
    Write-Host "   [DB DATA] $($r.Count) devices stored:" -ForegroundColor Green
    $r | Select-Object -First 3 | ForEach-Object { 
        Write-Host "     - $($_.name) ($($_.ip)) - $($_.status)" -ForegroundColor White 
    }
} catch {
    Write-Host "   [ERROR] $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   FEATURE SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "
[REAL-TIME DATA]
  - Network Scan (ARP)     - Uses 'arp -a' command
  - Network Info           - Uses os.networkInterfaces()
  - Port Scan              - Uses TCP socket connections
  
[DATABASE DATA]
  - Device Inventory       - SQLite with demo data
  - Security Alerts        - SQLite with demo data
  - Vulnerabilities        - SQLite with demo data

[MOCK/DEMO DATA]
  - AI Reports             - Placeholder responses
  - CVE Lookup             - NVD API (needs API key)
  - Security Score         - Calculated from demo data
" -ForegroundColor White
