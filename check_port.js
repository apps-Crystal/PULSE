const http = require('http');
const server = http.createServer((req, res) => {
    res.end('ok');
});
server.listen(3000, () => {
    console.log('Port 3000 is FREE');
    process.exit(0);
});
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log('Port 3000 is IN USE');
    } else {
        console.log('Error:', err.message);
    }
    process.exit(1);
});
