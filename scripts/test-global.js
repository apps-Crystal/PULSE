const ModbusRTU = require('modbus-serial');
const client = new ModbusRTU();

(async () => {
    try {
        console.log("🔌 Connecting to localhost:505...");
        await client.connectTCP("127.0.0.1", { port: 505 });
        client.setTimeout(2000);
        console.log("✅ Connected!");

        console.log("\n📍 Testing Global Signals (Slave 7)");
        console.log("=====================================");

        client.setID(7);
        const globalData = await client.readCoils(0, 3);

        console.log("   Coil 0 (Emergency Door 1):", globalData.data[0] ? "🔴 OPEN" : "🟢 CLOSED");
        console.log("   Coil 1 (Emergency Door 2):", globalData.data[1] ? "🔴 OPEN" : "🟢 CLOSED");
        console.log("   Coil 2 (Power Failure):   ", globalData.data[2] ? "🔴 FAIL" : "🟢 OK");

        console.log("\n📍 Testing Room Slaves (1-6)");
        console.log("=====================================");

        for (let i = 1; i <= 6; i++) {
            try {
                client.setID(i);
                const roomData = await client.readCoils(0, 2);
                console.log(`   Slave ${i}: Panic=${roomData.data[0] ? '🔴' : '🟢'} Door=${roomData.data[1] ? '🔴' : '🟢'}`);
            } catch (e) {
                console.log(`   Slave ${i}: ❌ ${e.message}`);
            }
        }

        client.close();
        console.log("\n✅ Test Complete!");
    } catch (e) {
        console.log("❌ FAILED:", e.message);
    }
})();
