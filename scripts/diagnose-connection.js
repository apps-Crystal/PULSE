
const ModbusRTU = require('modbus-serial');
const client = new ModbusRTU();

const CONFIG = {
    host: '127.0.0.1',
    port: 505
};

(async () => {
    console.log(`\n🩺 STARTING DIAGNOSTIC ON ${CONFIG.host}:${CONFIG.port}`);
    console.log("--------------------------------------------------");

    try {
        // Step 1: TCP Connect
        console.log(`1️⃣  Attempting TCP Connection...`);
        client.setTimeout(2000);
        await client.connectTCP(CONFIG.host, { port: CONFIG.port });
        console.log(`   ✅ TCP Connected! (Simulator is listening)`);
    } catch (e) {
        console.log(`   ❌ TCP Connection FAILED: ${e.message}`);
        console.log("   👉 Verify ModbusPal Port is 505 and Firewall is ON");
        process.exit(1);
    }

    // Step 2: Test Slave 1 (Coils)
    try {
        console.log(`\n2️⃣  Testing Slave ID 1 (Read Coils 0-5)...`);
        client.setID(1);
        const coils = await client.readCoils(0, 5);
        console.log(`   ✅ SUCCESS! Coils: ${JSON.stringify(coils.data)}`);
    } catch (e) {
        console.log(`   ❌ FAILED: ${e.message}`);
        if (e.message.includes('Timed Out')) {
            console.log("      ⚠️  TIMEOUT: Simulator connected but not replying.");
            console.log("      👉 CHECK: Is the 'RUN' button clicked in ModbusPal?");
        }
    }

    // Step 3: Test Slave 1 (Holding Registers - Just in case)
    try {
        console.log(`\n3️⃣  Testing Slave ID 1 (Read Registers 0-5)...`);
        client.setID(1);
        const regs = await client.readHoldingRegisters(0, 5);
        console.log(`   ✅ SUCCESS! Registers: ${JSON.stringify(regs.data)}`);
    } catch (e) {
        console.log(`   ❌ FAILED: ${e.message}`);
    }

    // Step 4: Test Unit ID 255 (Broadcasting/Default)
    try {
        console.log(`\n4️⃣  Testing Unit ID 0 (Broadcast)...`);
        client.setID(0);
        // Sometimes 0 or 255 works for default simulators via 502
        // But ModbusTCP usually ignores UnitID or uses it for routing.
        console.log("   (Skipping explicit broadcast test to avoid confusion)");
    } catch (e) { }

    console.log("\n--------------------------------------------------");
    console.log("🏁 DIAGNOSTIC COMPLETE");
    client.close();
})();
