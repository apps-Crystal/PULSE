# Vercel Deployment Guide

## Step 1: Expose Bridge Server with ngrok

### Install ngrok (if not already installed)
```bash
choco install ngrok
```

### Start ngrok tunnel
```bash
# Make sure bridge server is running first
# Then in a new terminal:
ngrok http 3001
```

You'll see output like:
```
Forwarding  https://abc123xyz.ngrok.io -> http://localhost:3001
```

**Copy the HTTPS URL** (e.g., `https://abc123xyz.ngrok.io`)

---

## Step 2: Configure Vercel Environment Variables

Go to your Vercel project settings → Environment Variables and add:

### Required Variables

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `NEXT_PUBLIC_BRIDGE_URL` | `https://your-ngrok-url.ngrok.io` | Replace with your ngrok URL |
| `NEXT_PUBLIC_BRIDGE_API_KEY` | `o2awBtFr3CHnPEkcG4ATL7Vdz15iZJfD` | From bridge-server/.env |
| `GOOGLE_CREDENTIALS` | (copy from .env.local) | Google Sheets credentials |
| `GOOGLE_SHEET_ID` | `1AOsFM0ldUzXMqwpwYpiQsFle1epES22yk_n_p4dLlz4` | From .env.local |

### How to Add in Vercel

1. Go to https://vercel.com/dashboard
2. Select your PULSE project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Name: `NEXT_PUBLIC_BRIDGE_URL`
   - Value: `https://your-ngrok-url.ngrok.io`
   - Environment: Production, Preview, Development (select all)
   - Click **Save**
5. Repeat for all variables

---

## Step 3: Deploy to Vercel

### Option A: Git Push (Recommended)
```bash
git add .
git commit -m "Add bridge server architecture for Vercel deployment"
git push
```

Vercel will auto-deploy on push.

### Option B: Manual Deploy
```bash
npm run build
vercel --prod
```

---

## Step 4: Verify Deployment

1. **Check Vercel Deployment Status**
   - Go to Vercel dashboard
   - Wait for deployment to complete (usually 1-2 minutes)

2. **Visit Your Vercel URL**
   - Click on the deployment URL
   - Dashboard should load

3. **Check Browser Console**
   - Press F12 to open DevTools
   - Look for any errors
   - Should see PLC data being fetched

4. **Verify Data Flow**
   - Check if room cards show live data
   - Toggle a sensor in ModbusPal
   - Verify dashboard updates within 5 seconds

---

## Troubleshooting

### ❌ "Bridge server timeout"
- Ensure bridge server is running locally
- Verify ngrok tunnel is active
- Check ngrok URL in Vercel environment variables

### ❌ "401 Unauthorized"
- Verify `NEXT_PUBLIC_BRIDGE_API_KEY` in Vercel matches `API_KEY` in bridge-server/.env
- Redeploy after updating environment variables

### ❌ ngrok URL changes after restart
- Free ngrok URLs change on restart
- Update Vercel environment variable with new URL
- Redeploy
- **Solution:** Use ngrok paid plan for static URLs or Cloudflare Tunnel

### ❌ "This site can't be reached"
- Bridge server must be running on your local machine
- ngrok tunnel must be active
- Firewall must allow ngrok connections

---

## Important Notes

⚠️ **Bridge Server Must Stay Running**
- Your local machine with the bridge server must stay on
- Bridge server must be running for Vercel app to work
- ngrok tunnel must be active

⚠️ **ngrok Free Tier Limitations**
- URL changes on restart
- 2-hour session limit (reconnects automatically)
- For production, consider:
  - ngrok paid plan (static URLs)
  - Cloudflare Tunnel (free, static URLs)
  - VPS deployment

---

## Production Recommendations

### For Long-term Production:

1. **Use Cloudflare Tunnel** (free, static URLs)
   ```bash
   choco install cloudflare-cloudflared
   cloudflared tunnel --url http://localhost:3001
   ```

2. **Auto-start Bridge on Boot**
   - Create Windows scheduled task
   - Run `bridge-server/start.bat` on startup

3. **Monitor Bridge Health**
   - Set up UptimeRobot or similar
   - Alert on bridge downtime

4. **Consider VPS Deployment**
   - Deploy bridge to VPS on same network
   - More reliable than local machine
   - Static IP/domain

---

## Quick Reference

### Start Everything for Production

```bash
# Terminal 1: Start Bridge Server
cd bridge-server
start.bat

# Terminal 2: Start ngrok
ngrok http 3001

# Copy ngrok URL and update Vercel if needed
# Vercel app is now live!
```
