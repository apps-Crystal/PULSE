# 🧊 Pulse | Cold Chain Warehouse Monitor

A real-time monitoring and alarm system for cold storage warehouses, integrating PLC sensors via Modbus TCP/IP with a modern web dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16.1.2-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-blue?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)

## 🎯 Features

- **Real-time PLC Integration**: Connects to Siemens S7-1200/1500 or compatible PLCs via Modbus TCP/IP
- **Interactive Warehouse Map**: Visual blueprint overlay with live status indicators for each room
- **Multi-sensor Support**: Monitors panic buttons, door sensors, temperature, and power status
- **Live Event Feed**: Real-time alarm log with status tracking
- **Digital Message Board**: Prominent alarm display replacing physical hooters
- **Google Sheets Logging**: Optional cloud logging for alarm history (configurable)
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Sensors   │────────▶│  PLC (S7)    │────────▶│  ModbusPal  │
│ (Physical)  │         │  Modbus TCP  │         │  Simulator  │
└─────────────┘         └──────────────┘         └─────────────┘
                                                         │
                                                         │ TCP:502
                                                         ▼
                                                  ┌─────────────┐
                                                  │  Next.js    │
                                                  │  Backend    │
                                                  │  API Routes │
                                                  └─────────────┘
                                                         │
                                    ┌────────────────────┼────────────────────┐
                                    ▼                    ▼                    ▼
                             ┌──────────┐        ┌──────────┐        ┌──────────┐
                             │ Modbus   │        │ Webhook  │        │  Sheets  │
                             │ Endpoint │        │ Receiver │        │  Logger  │
                             └──────────┘        └──────────┘        └──────────┘
                                    │                    │                    │
                                    └────────────────────┴────────────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │  React UI   │
                                                  │  Dashboard  │
                                                  └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm
- **ModbusPal** (for testing) or a real PLC with Modbus TCP enabled
- **(Optional)** Google Cloud Service Account for Sheets integration

### Installation

1. **Clone the repository**
   ```bash
   cd c:\Users\crpla\OneDrive\Desktop\pulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (optional)
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` if you want Google Sheets logging:
   ```env
   GOOGLE_CREDENTIALS={"type":"service_account",...}
   GOOGLE_SHEET_ID=your-spreadsheet-id
   ```

4. **Configure Modbus connection**
   
   Edit `lib/modbus.js` to match your PLC settings:
   ```javascript
   const HOST = '192.168.1.104';  // Your PLC IP
   const PORT = 502;               // Modbus TCP port
   const SLAVE_ID = 1;             // Modbus slave ID
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the dashboard**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Warehouse Layout

Edit `config/warehouse-map.js` to match your facility:

```javascript
export const WAREHOUSE_CONFIG = {
    rooms: [
        {
            id: 'Frozen-A',
            label: 'Frozen Store A',
            x: 75,        // Position (% from left)
            y: 20,        // Position (% from top)
            width: 14,    // Width (%)
            height: 18,   // Height (%)
            sensors: ['temp', 'door', 'panic'],
            tempSetpoint: -20
        },
        // ... more rooms
    ]
};
```

### Modbus Coil Mapping

Current mapping in `lib/modbus.js`:

| Coil Address | Sensor Type | Room ID |
|--------------|-------------|---------|
| 0            | Panic Button | Room 001 |
| 1            | Door Sensor  | Room 001 |
| 2            | Emergency    | Room 101 |

Modify `components/WarehouseDashboard.jsx` to add more sensors or change mappings.

### Warehouse Blueprint

Replace `public/warehouse-map.png` with your facility's blueprint image for accurate visualization.

## 📡 API Endpoints

### `GET /api/modbus-data`
Reads live sensor data from the PLC via Modbus.

**Response:**
```json
{
  "panic": false,
  "door": true,
  "emergency": false,
  "timestamp": "2026-01-16T07:30:00.000Z"
}
```

### `POST /api/alarms`
Webhook endpoint for receiving alarms from external systems (e.g., PLC HTTP POST).

**Request Body:**
```json
{
  "device_id": "PLC-001",
  "alarm_type": "door_open",
  "room_id": "Chiller-1",
  "status": "active",
  "message": "Door left open for 5 minutes"
}
```

### `GET /api/alarms-status`
Retrieves current alarm status and history.

**Response:**
```json
{
  "success": true,
  "latest": { /* latest alarm */ },
  "history": [ /* array of recent alarms */ ]
}
```

## 🧪 Testing

### Test Modbus Connection

```bash
node scripts/test-lib-modbus.mjs
```

Expected output:
```
Testing lib/modbus.js...
🔌 Connecting to ModbusPal at 192.168.1.104:502...
✅ Connected to ModbusPal
Result: { panic: false, door: false, emergency: false, timestamp: '...' }
✅ Library Verification Successful
```

### Using ModbusPal Simulator

1. Download and run [ModbusPal](https://sourceforge.net/projects/modbuspal/)
2. Create a new Modbus slave (ID: 1)
3. Add coils at addresses 0, 1, 2
4. Toggle coils to simulate sensor triggers
5. Watch the dashboard update in real-time

## 📊 Google Sheets Integration (Optional)

1. **Create a Google Cloud Service Account**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google Sheets API
   - Create a Service Account and download JSON credentials

2. **Create a Google Sheet**
   - Create a new spreadsheet
   - Share it with the service account email
   - Copy the spreadsheet ID from the URL

3. **Configure Environment**
   ```env
   GOOGLE_CREDENTIALS={"type":"service_account","project_id":"..."}
   GOOGLE_SHEET_ID=1abc...xyz
   ```

4. **Sheet Format**
   
   The system will append rows to `Sheet1` with columns:
   | Timestamp | Device ID | Alarm Type | Room ID | Status | Message | Notes |
   |-----------|-----------|------------|---------|--------|---------|-------|

## 🎨 Customization

### Color Scheme

The dashboard uses a dark theme with accent colors:
- **Primary**: Blue/Cyan gradient
- **Alarm Active**: Red with pulsing animation
- **Normal State**: Slate gray

Modify colors in component files or add custom Tailwind classes.

### Adding New Sensors

1. Update `lib/modbus.js` to read additional coils
2. Add mapping logic in `components/WarehouseDashboard.jsx`
3. Update `config/warehouse-map.js` with new sensor types
4. Add visual indicators in `components/WarehouseMap.jsx`

## 📦 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Environment Variables

Set these in your deployment platform:
- `GOOGLE_CREDENTIALS` (optional)
- `GOOGLE_SHEET_ID` (optional)

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1.2 (Pages Router)
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4.0
- **Icons**: Lucide React
- **Modbus Client**: modbus-serial
- **Cloud Integration**: Google Sheets API (googleapis)

## 📝 Project Structure

```
pulse/
├── components/
│   ├── WarehouseDashboard.jsx  # Main dashboard component
│   └── WarehouseMap.jsx         # Interactive warehouse map
├── config/
│   └── warehouse-map.js         # Room layout configuration
├── lib/
│   ├── modbus.js                # Modbus TCP client
│   └── googleSheets.js          # Google Sheets integration
├── pages/
│   ├── api/
│   │   ├── modbus-data.js       # Modbus data endpoint
│   │   ├── alarms.js            # Webhook receiver
│   │   └── alarms-status.js     # Status endpoint
│   ├── _app.js                  # App wrapper
│   └── index.js                 # Home page
├── public/
│   └── warehouse-map.png        # Blueprint image
├── scripts/
│   └── test-lib-modbus.mjs      # Test script
└── styles/
    └── globals.css              # Global styles
```

## 🐛 Troubleshooting

### Modbus Connection Failed

- Verify PLC IP address and port in `lib/modbus.js`
- Ensure PLC is on the same network
- Check firewall settings (port 502)
- Test with ModbusPal simulator first

### Dashboard Not Updating

- Check browser console for errors
- Verify `/api/modbus-data` returns data
- Ensure polling interval is set (default: 2 seconds)

### Google Sheets Not Logging

- Verify `GOOGLE_CREDENTIALS` is valid JSON
- Check service account has edit access to the sheet
- Review server logs for authentication errors

## 📄 License

This project is private and proprietary.

## 🤝 Support

For issues or questions, contact the development team.

---

**Built with ❄️ for cold chain excellence**
#   P U L S E  
 