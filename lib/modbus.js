import ModbusRTU from 'modbus-serial';

// Singleton client instance
let client = null;
const HOST = '192.168.1.104';
const PORT = 505;

// Slave IDs mapping to rooms (matching ModbusPal config exactly)
// 0.0.0.1 = Slave ID 1 = Chiller_Room_1
// 0.0.0.2 = Slave ID 2 = Chiller_Room_2
// etc.
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

// Global signals slave (Slave ID 7)
// Coil 0 -> Emergency Door 1
// Coil 1 -> Emergency Door 2
// Coil 2 -> Power Failure
const GLOBAL_SLAVE_ID = 7;

/**
 * Ensures a connected Modbus client exists.
 */
async function getClient() {
    if (client && client.isOpen) {
        return client;
    }

    if (!client) {
        client = new ModbusRTU();
    }

    try {
        console.log(`🔌 Connecting to ModbusPal at ${HOST}:${PORT}...`);
        await client.connectTCP(HOST, { port: PORT });
        client.setTimeout(1000); // Reduced timeout for faster offline detection
        console.log('✅ Connected to ModbusPal');
    } catch (error) {
        console.error('❌ Failed to connect to ModbusPal:', error.message);
        throw error;
    }

    return client;
}

/**
 * Reads global signals from Slave 7.
 * Returns: { emergencyDoor1, emergencyDoor2, powerFailure }
 */
async function readGlobalSignals() {
    try {
        const modbus = await getClient();
        modbus.setID(GLOBAL_SLAVE_ID);

        // Read 3 coils starting from address 0
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

/**
 * Reads coils from a specific room slave.
 * Coil mapping (per room):
 * - Coil 0 -> Panic Button
 * - Coil 1 -> Door Sensor
 */
async function readRoomData(slaveId) {
    try {
        const modbus = await getClient();
        modbus.setID(slaveId);

        // Read 2 coils starting from address 0 (panic, door)
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

/**
 * Reads data from all configured room slaves.
 * Returns an object with room data keyed by room ID.
 */
export async function getPlcData() {
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

        // Read global signals (always attempt, even if some rooms failed)
        const global = await readGlobalSignals();

        if (!hasAnyData && !global) {
            // All rooms AND global failed - return null
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
