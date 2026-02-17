# PULSE Bridge Server

Local Modbus bridge server that exposes PLC data via REST API for the PULSE monitoring system.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env` file:
```env
MODBUS_HOST=192.168.1.104
MODBUS_PORT=505
PORT=3001
API_KEY=your_secure_api_key_here
```

### 3. Start Server
**Windows:**
```bash
start.bat
```

**Manual:**
```bash
npm start
```

## API Endpoints

### `GET /api/health`
Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-17T08:00:00.000Z",
  "lastUpdate": "2026-02-17T08:00:00.000Z",
  "modbusHost": "192.168.1.104",
  "modbusPort": 505
}
```

### `GET /api/plc-data`
Get current PLC data (requires API key).

**Headers:**
```
X-API-Key: your_api_key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rooms": {
      "Chiller_Room_1": { "panic": false, "door": false },
      "Frozen_Room_1": { "panic": false, "door": true }
    },
    "global": {
      "emergencyDoor1": false,
      "emergencyDoor2": false,
      "powerFailure": false
    },
    "timestamp": "2026-02-17T08:00:00.000Z"
  },
  "cachedAt": "2026-02-17T08:00:00.000Z"
}
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MODBUS_HOST` | `192.168.1.104` | Modbus TCP server IP |
| `MODBUS_PORT` | `505` | Modbus TCP port |
| `PORT` | `3001` | Bridge server port |
| `POLL_INTERVAL` | `5000` | Polling interval (ms) |
| `API_KEY` | - | API key for authentication |

## Exposing to Internet

For Vercel deployment, you need to expose the bridge server publicly.

### Option 1: ngrok (Quick Setup)
```bash
# Install ngrok
choco install ngrok

# Start bridge server
npm start

# In another terminal, expose it
ngrok http 3001
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and use it in your Vercel environment variables.

### Option 2: Cloudflare Tunnel (Recommended for Production)
```bash
# Install cloudflared
choco install cloudflare-cloudflared

# Start bridge server
npm start

# Create tunnel
cloudflared tunnel --url http://localhost:3001
```

## Security Notes

⚠️ **Important:**
- Always use a strong API key in production
- Use HTTPS (ngrok/Cloudflare provide this automatically)
- Consider IP whitelisting if possible
- Monitor access logs

## Troubleshooting

**Bridge won't connect to Modbus:**
- Verify ModbusPal is running
- Check `MODBUS_HOST` and `MODBUS_PORT` in `.env`
- Ensure firewall allows connections

**API returns 503:**
- Bridge is starting or PLCs are offline
- Check console logs for connection errors

**401 Unauthorized:**
- Verify `X-API-Key` header matches `.env` API_KEY
