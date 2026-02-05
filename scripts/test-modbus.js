// Modbus Connection Test Script
// Run with: node scripts/test-modbus.js

const ModbusRTU = require('modbus-serial');

const HOST = '127.0.0.1';
const PORT = 505;

const SLAVES = {
    'Chiller_Room_1': 1,
    'Chiller_Room_2': 2,
    'Chiller_Room_3': 3,
    'Chiller_Room_4': 4,
    'Chiller_Room_5': 5,
    'Chiller_Room_6': 6,
};

async function testConnection() {
    const client = new ModbusRTU();

    console.log('='.repeat(50));
    console.log('  MODBUS CONNECTION TEST');
    console.log('='.repeat(50));
    console.log(`\n🔌 Connecting to ${HOST}:${PORT}...\n`);

    try {
        await client.connectTCP(HOST, { port: PORT });
        client.setTimeout(3000);
        console.log('✅ TCP Connection SUCCESSFUL!\n');
    } catch (error) {
        console.log('❌ TCP Connection FAILED!');
        console.log(`   Error: ${error.message}\n`);
        console.log('💡 Make sure ModbusPal is running and listening on port 505');
        process.exit(1);
    }

    console.log('-'.repeat(50));
    console.log('  Testing each slave...');
    console.log('-'.repeat(50));

    let successCount = 0;
    let failCount = 0;

    for (const [roomName, slaveId] of Object.entries(SLAVES)) {
        process.stdout.write(`\n📡 Slave ${slaveId} (${roomName}): `);

        try {
            client.setID(slaveId);
            const data = await client.readCoils(0, 3);

            console.log('✅ ONLINE');
            console.log(`   Panic: ${data.data[0] ? '🔴 ACTIVE' : '🟢 OK'}`);
            console.log(`   Door:  ${data.data[1] ? '🟡 OPEN' : '🟢 CLOSED'}`);
            console.log(`   Emerg: ${data.data[2] ? '🔴 ACTIVE' : '🟢 OK'}`);
            successCount++;
        } catch (error) {
            console.log('❌ OFFLINE');
            console.log(`   Error: ${error.message}`);
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('  TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`\n✅ Online:  ${successCount}/${Object.keys(SLAVES).length}`);
    console.log(`❌ Offline: ${failCount}/${Object.keys(SLAVES).length}`);

    if (failCount === 0) {
        console.log('\n🎉 All slaves are responding! System ready.\n');
    } else if (successCount > 0) {
        console.log('\n⚠️  Some slaves are not responding.');
        console.log('💡 Enable them in ModbusPal by clicking the blue ↑ button.\n');
    } else {
        console.log('\n❌ No slaves responding.');
        console.log('💡 Check ModbusPal configuration and enable all slaves.\n');
    }

    client.close();
}

testConnection().catch(console.error);
