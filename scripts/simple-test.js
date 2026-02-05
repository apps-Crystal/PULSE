const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

(async () => {
    try {
        console.log("Connecting to 192.168.1.104:505...");
        await client.connectTCP("192.168.1.104", { port: 505 });
        client.setID(1);
        client.setTimeout(5000);

        console.log("Reading coils from Slave 1...");
        const res = await client.readCoils(0, 3);
        console.log("Result:", res.data);
        console.log("Panic:", res.data[0]);
        console.log("Door:", res.data[1]);
        console.log("Emergency:", res.data[2]);

        client.close();
        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
})();
