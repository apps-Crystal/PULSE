import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ModbusRTU from 'modbus-serial';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'pulse_dev_key';

// Middleware
app.use(cors());
app.use(express.json());

// API Key Authentication Middleware
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};

// ============================================
// MODBUS CONFIGURATION (from lib/modbus.js)
// ============================================

let client = null;
const HOST = process.env.MODBUS_HOST || '192.168.1.104';
const MODBUS_PORT = parseInt(process.env.MODBUS_PORT) || 505;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL) || 5000;

// Slave IDs mapping to rooms
const ROOM_SLAVES = {
    'Chiller_Room_1': 1,
    'Chiller_Room_2': 2,
    'Chiller_Room_3': 3,
    'Chiller_Room_4': 4,
    'Chiller_Room_5': 5,
    'Chiller_Room_6': 6,
    'Frozen_Room_1': 8,
    'Frozen_Room_2': 9,
    'Frozen_Room_3': 10,
    'Frozen_Room_4': 11,
    'Frozen_Room_5': 12,
};

const GLOBAL_SLAVE_ID = 7;

// In-memory cache for last known state
let cachedPlcData = null;
let lastUpdateTime = null;

// ============================================
// MODBUS FUNCTIONS
// ============================================

async function getClient() {
    if (client && client.isOpen) {
        return client;
    }

    if (!client) {
        client = new ModbusRTU();
    }

    try {
        console.log(`🔌 Connecting to ModbusPal at ${HOST}:${MODBUS_PORT}...`);
        await client.connectTCP(HOST, { port: MODBUS_PORT });
        client.setTimeout(1000);
        console.log('✅ Connected to ModbusPal');
    } catch (error) {
        console.error('❌ Failed to connect to ModbusPal:', error.message);
        throw error;
    }

    return client;
}

async function readGlobalSignals() {
    try {
        const modbus = await getClient();
        modbus.setID(GLOBAL_SLAVE_ID);

        const data = await modbus.readCoils(0, 3);

        return {
            emergencyDoor1: data.data[0],
            emergencyDoor2: data.data[1],
            powerFailure: data.data[2]
        };
    } catch (error) {
        console.warn(`⚠️ Error reading global slave ${GLOBAL_SLAVE_ID}:`, error.message);
        return null;
    }
}

async function readRoomData(slaveId) {
    try {
        const modbus = await getClient();
        modbus.setID(slaveId);

        const data = await modbus.readCoils(0, 2);

        return {
            panic: data.data[0],
            door: data.data[1]
        };
    } catch (error) {
        console.warn(`⚠️ Error reading slave ${slaveId}:`, error.message);
        return null;
    }
}

async function getPlcData() {
    try {
        const roomData = {};
        let hasAnyData = false;

        // Read from each slave sequentially
        for (const [roomId, slaveId] of Object.entries(ROOM_SLAVES)) {
            const data = await readRoomData(slaveId);
            if (data) {
                roomData[roomId] = data;
                hasAnyData = true;
            } else {
                // Room offline - set defaults
                roomData[roomId] = {
                    panic: false,
                    door: false,
                    offline: true
                };
            }
        }

        // Read global signals
        const global = await readGlobalSignals();

        if (!hasAnyData && !global) {
            return null;
        }

        return {
            rooms: roomData,
            global: global || {
                emergencyDoor1: false,
                emergencyDoor2: false,
                powerFailure: false,
                offline: true
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('⚠️ Error reading PLC data:', error.message);
        // Attempt to force close so we reconnect next time
        if (client) {
            try {
                client.close();
            } catch (e) {
                // Ignore close errors
            }
            client = null;
        }
        return null;
    }
}

// ============================================
// POLLING LOGIC
// ============================================

async function pollPlcData() {
    const data = await getPlcData();
    if (data) {
        cachedPlcData = data;
        lastUpdateTime = new Date().toISOString();
        console.log(`📊 PLC data updated at ${lastUpdateTime}`);
    } else {
        console.warn('⚠️ Failed to read PLC data, keeping cached data');
    }
}

// Start polling on server startup
setInterval(pollPlcData, POLL_INTERVAL);
pollPlcData(); // Initial poll

// ============================================
// API ROUTES
// ============================================

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        lastUpdate: lastUpdateTime,
        modbusHost: HOST,
        modbusPort: MODBUS_PORT
    });
});

// Get current PLC data (requires API key)
app.get('/api/plc-data', authenticateApiKey, (req, res) => {
    if (!cachedPlcData) {
        return res.status(503).json({
            error: 'PLC data not available',
            message: 'Bridge server is starting or PLCs are offline'
        });
    }

    res.json({
        success: true,
        data: cachedPlcData,
        cachedAt: lastUpdateTime
    });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   🌉 PULSE Bridge Server Running          ║
╚════════════════════════════════════════════╝

📡 Server:        http://localhost:${PORT}
🔌 Modbus Target: ${HOST}:${MODBUS_PORT}
🔄 Poll Interval: ${POLL_INTERVAL}ms
🔑 API Key:       ${API_KEY.substring(0, 10)}...

Endpoints:
  GET /api/health     - Health check (no auth)
  GET /api/plc-data   - PLC data (requires X-API-Key header)

Press Ctrl+C to stop
    `);
});
