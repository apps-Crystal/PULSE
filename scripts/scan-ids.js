
const ModbusRTU = require('modbus-serial');
const client = new ModbusRTU();

(async () => {
    try {
        console.log("Connecting to localhost:505...");
        await client.connectTCP("127.0.0.1", { port: 505 });
        client.setTimeout(1000); // Fast timeout

        console.log("------------------------------------------------");
        console.log("🔍 SCANNING SLAVE_IDS 1-10 FOR RESPONSES...");

        for (let i = 1; i <= 10; i++) {
            client.setID(i);
            process.stdout.write(`   Testing ID ${i}... `);
            try {
                // Try reading 1 coil
                const data = await client.readCoils(0, 1);
                console.log(`✅ FOUND! Data: ${JSON.stringify(data.data)}`);
            } catch (e) {
                console.log(`❌ ${e.message}`);
            }
        }
    } catch (e) {
        console.log("FATAL CONNECTION ERROR:", e.message);
    } finally {
        client.close();
    }
})();
