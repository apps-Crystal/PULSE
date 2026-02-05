
const ModbusRTU = require('modbus-serial');

const PORTS = [502, 503, 504, 505];
const IPS = ['127.0.0.1', '192.168.1.104', '192.168.29.252', 'localhost'];

(async () => {
    console.log("🔍 STARTING MODBUS DISCOVERY SCAN...");
    console.log("----------------------------------------");

    for (const ip of IPS) {
        for (const port of PORTS) {
            const client = new ModbusRTU();
            try {
                // Short timeout for discovery
                client.setTimeout(2000);

                await client.connectTCP(ip, { port: port });
                console.log(`✅ SUCCESS: Connected to ${ip} on port ${port}`);

                // Try to identify if it's our PLC by reading slave 1
                client.setID(1);
                try {
                    const data = await client.readCoils(0, 3);
                    console.log(`   📝 Data Read Success (Slave 1):`, data.data);
                    console.log(`   🚀 RECOMMENDED CONFIG: IP='${ip}', PORT=${port}`);
                    process.exit(0); // Stop after first success
                } catch (readErr) {
                    console.log(`   ⚠️ Connected but read failed on Slave 1: ${readErr.message}`);
                }

                client.close();
            } catch (e) {
                // process.stdout.write(`   . Failed: ${ip}:${port} \r`);
            }
        }
    }

    console.log("\n----------------------------------------");
    console.log("❌ SCAN COMPLETE: No working Modbus PLC found.");
    console.log("   Check: 1. ModbusPal is running");
    console.log("          2. 'Run' button is clicked (if applicable)");
    console.log("          3. Firewall is allowing the port");
})();
