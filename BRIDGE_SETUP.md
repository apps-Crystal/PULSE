# PULSE Bridge Setup Guide

Complete guide for setting up the local Modbus bridge server and deploying the PULSE frontend to Vercel.

---

## Architecture Overview

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│  ModbusPal  │ ◄─────► │  Bridge Server   │ ◄─────► │   Vercel     │
│  (PLCs)     │  TCP    │  (Local Machine) │  HTTPS  │  (Frontend)  │
│ :505        │         │  :3001           │         │              │
└─────────────┘         └──────────────────┘         └──────────────┘
                              ▲
                              │ Exposed via
                              │ ngrok/Cloudflare
                              ▼
                        🌐 Internet
```

---

## Part 1: Local Bridge Server Setup

### Step 1: Install Dependencies

```bash
cd bridge-server
npm install
```

### Step 2: Configure Environment

Edit `bridge-server/.env`:

```env
MODBUS_HOST=192.168.1.104
MODBUS_PORT=505
PORT=3001
POLL_INTERVAL=5000
API_KEY=your_secure_api_key_here
```

**Generate a secure API key:**
```bash
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Step 3: Start Bridge Server

**Option A: Using start.bat (Windows)**
```bash
cd bridge-server
start.bat
```

**Option B: Manual**
```bash
cd bridge-server
npm start
```

You should see:
```
╔════════════════════════════════════════════╗
║   🌉 PULSE Bridge Server Running          ║
╚════════════════════════════════════════════╝

📡 Server:        http://localhost:3001
🔌 Modbus Target: 192.168.1.104:505
🔄 Poll Interval: 5000ms
```

### Step 4: Test Bridge Server

```bash
# Health check (no auth)
curl http://localhost:3001/api/health

# PLC data (requires API key)
curl -H "X-API-Key: your_api_key" http://localhost:3001/api/plc-data
```

---

## Part 2: Expose Bridge to Internet

For Vercel to access your local bridge server, you need to expose it publicly.

### Option A: ngrok (Quick Setup)

1. **Install ngrok:**
   ```bash
   choco install ngrok
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 3001
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

### Option B: Cloudflare Tunnel (Recommended for Production)

1. **Install cloudflared:**
   ```bash
   choco install cloudflare-cloudflared
   ```

2. **Create tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```

3. **Copy the HTTPS URL** provided

---

## Part 3: Frontend Configuration

### Step 1: Update Local Environment

Edit `.env.local`:

```env
# For local development (bridge on same machine)
NEXT_PUBLIC_BRIDGE_URL=http://localhost:3001
NEXT_PUBLIC_BRIDGE_API_KEY=your_api_key
```

### Step 2: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` - dashboard should load and display PLC data.

---

## Part 4: Vercel Deployment

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add bridge server architecture for Vercel deployment"
git push
```

### Step 2: Configure Vercel Environment Variables

In your Vercel project settings, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_BRIDGE_URL` | `https://your-ngrok-url.ngrok.io` |
| `NEXT_PUBLIC_BRIDGE_API_KEY` | `your_api_key` |
| `GOOGLE_CREDENTIALS` | (copy from `.env.local`) |
| `GOOGLE_SHEET_ID` | (copy from `.env.local`) |

### Step 3: Deploy

```bash
# Vercel will auto-deploy on push, or manually:
vercel --prod
```

### Step 4: Verify

1. Visit your Vercel URL
2. Dashboard should load and show live PLC data
3. Check browser console for any errors

---

## Troubleshooting

### Bridge Server Issues

**❌ "Cannot connect to ModbusPal"**
- Verify ModbusPal is running
- Check `MODBUS_HOST` and `MODBUS_PORT` in `.env`
- Ensure firewall allows connections

**❌ "Port 3001 already in use"**
- Change `PORT` in `.env` to another port (e.g., 3002)
- Update ngrok/Cloudflare command accordingly

### Frontend Issues

**❌ "Bridge server timeout"**
- Ensure bridge server is running
- Check `NEXT_PUBLIC_BRIDGE_URL` is correct
- Verify ngrok/Cloudflare tunnel is active

**❌ "401 Unauthorized"**
- Verify `NEXT_PUBLIC_BRIDGE_API_KEY` matches bridge `.env` `API_KEY`

**❌ "503 Service Unavailable"**
- Bridge server is running but PLCs are offline
- Check ModbusPal connection

### Vercel Deployment Issues

**❌ Environment variables not working**
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding environment variables

**❌ ngrok URL changes on restart**
- Use ngrok paid plan for static URLs
- Or switch to Cloudflare Tunnel with custom domain

---

## Production Recommendations

### Security

1. **Use strong API keys** (32+ characters, random)
2. **Enable HTTPS** (ngrok/Cloudflare provide this)
3. **Consider IP whitelisting** in bridge server
4. **Rotate API keys** periodically

### Reliability

1. **Auto-start bridge on boot:**
   - Windows: Create scheduled task to run `start.bat`
   - Linux: Create systemd service

2. **Monitor bridge health:**
   - Set up uptime monitoring (UptimeRobot, etc.)
   - Alert on bridge downtime

3. **Use static tunnel URL:**
   - ngrok paid plan or Cloudflare with custom domain

### Scaling

For production, consider:
- **VPS deployment** instead of local machine
- **VPN** (Tailscale) for secure access without public exposure
- **Load balancing** if multiple PLC sites

---

## Quick Reference

### Start Everything

```bash
# Terminal 1: Start ModbusPal
# (Run ModbusPal GUI)

# Terminal 2: Start Bridge
cd bridge-server
npm start

# Terminal 3: Expose Bridge
ngrok http 3001

# Terminal 4: Start Frontend (local dev)
npm run dev
```

### Stop Everything

```bash
# Ctrl+C in each terminal
```

---

## Next Steps

- [ ] Generate secure API key
- [ ] Test bridge locally with ModbusPal
- [ ] Set up ngrok/Cloudflare tunnel
- [ ] Configure Vercel environment variables
- [ ] Deploy to Vercel
- [ ] Verify end-to-end connectivity
- [ ] Set up auto-start for bridge server
