import { getPlcData } from '../lib/modbus.js';

async function test() {
    console.log('Testing lib/modbus.js...');
    const data = await getPlcData();
    console.log('Result:', data);
    if (data && data.panic !== undefined) {
        console.log('✅ Library Verification Successful');
    } else {
        console.log('❌ Library Verification Failed');
    }
    process.exit(0);
}

test();
