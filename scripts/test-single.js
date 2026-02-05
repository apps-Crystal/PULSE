const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

(async () => {
    try {
        console.log("Connecting to 127.0.0.1:505...");
        await client.connectTCP("127.0.0.1", { port: 505 });
        client.setID(1);

        console.log("Reading coils...");
        const res = await client.readCoils(0, 2);
        console.log("SUCCESS:", res.data);

        client.close();
    } catch (error) {
        console.error("ERROR:", error.message);
    }
})();
