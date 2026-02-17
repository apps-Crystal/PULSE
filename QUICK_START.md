# Quick Start Guide

## 🚀 Getting Started

### 1. Install Bridge Dependencies
```bash
cd bridge-server
npm install
```

### 2. Start Bridge Server
```bash
cd bridge-server
start.bat
```

### 3. Test Locally
```bash
# In main directory
npm run dev
```

Visit `http://localhost:3000` - should show dashboard with PLC data.

---

## 📋 Next Steps for Vercel Deployment

1. **Generate API Key:**
   ```powershell
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   ```

2. **Update `.env` files** with the API key

3. **Expose bridge with ngrok:**
   ```bash
   ngrok http 3001
   ```

4. **Configure Vercel:**
   - Add `NEXT_PUBLIC_BRIDGE_URL` = ngrok URL
   - Add `NEXT_PUBLIC_BRIDGE_API_KEY` = your API key

5. **Deploy:**
   ```bash
   git push
   ```

---

For complete instructions, see [BRIDGE_SETUP.md](file:///c:/Users/crpla/OneDrive/Desktop/aPPS/Pulse/PULSE/BRIDGE_SETUP.md)
