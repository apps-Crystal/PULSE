const ModbusRTU = require("modbus-serial");

const client = new ModbusRTU();

async function testModbus() {
    try {
        console.log("Connecting to ModbusPal at 192.168.1.104...");

        await client.connectTCP("192.168.1.104", { port: 503 });
        client.setID(1);
        client.setTimeout(5000); // 5s timeout

        console.log("Connected. Testing different addresses...");

        // Try reading from address 0
        try {
            const result0 = await client.readCoils(0, 3);
            console.log("\n✅ SUCCESS reading from Address 0:");
            console.log("📊 Coils 0-2:", result0.data);
        } catch (e) {
            console.log("\n❌ Address 0 failed:", e.message);
        }

        // Try reading from address 1
        try {
            const result1 = await client.readCoils(1, 3);
            console.log("\n✅ SUCCESS reading from Address 1:");
            console.log("📊 Coils 1-3:", result1.data);
        } catch (e) {
            console.log("\n❌ Address 1 failed:", e.message);
        }
    } catch (e) {
        console.log("Could not read Address 2:", e.message);
    }

    client.close();

}

testModbus();
