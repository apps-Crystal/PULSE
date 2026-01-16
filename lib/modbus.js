import ModbusRTU from 'modbus-serial';

// Singleton client instance
let client = null;
const HOST = '192.168.1.104';
const PORT = 503;
const SLAVE_ID = 1;

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
        client.setID(SLAVE_ID);
        client.setTimeout(5000);
        console.log('✅ Connected to ModbusPal');
    } catch (error) {
        console.error('❌ Failed to connect to ModbusPal:', error.message);
        throw error;
    }

    return client;
}

/**
 * Reads the coils from the PLC.
 * Maps:
 * - Coil 0 -> Panic Button
 * - Coil 1 -> Door Sensor
 * - Coil 2 -> Room_101_Emergency
 */
export async function getPlcData() {
    try {
        const modbus = await getClient();

        // Read 3 coils starting from address 0
        // Address 0: Panic
        // Address 1: Door
        // Address 2: Emergency
        const data = await modbus.readCoils(0, 3);

        return {
            panic: data.data[0],
            door: data.data[1],
            emergency: data.data[2],
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('⚠️ Error reading PLC data:', error.message);
        // Attempt to force close so we reconnect next time
        if (client) {
            client.close();
        }
        return null; // Return null to indicate error/offline
    }
}
