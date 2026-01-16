const https = require('http');

// Specific hardware mapped alarms
const SCENARIOS = [
  { device_id: 'DI_01', alarm_type: 'panic_button', room_id: 'Frozen-A', message: 'PANIC BUTTON PRESSED' },
  { device_id: 'DI_02', alarm_type: 'door_open', room_id: 'Chiller-3', message: 'Door Open > 5 mins' },
  { device_id: 'DI_03', alarm_type: 'power_failure', room_id: 'Main-Power', message: 'MAIN POWER FAILURE' },
  { device_id: 'DI_04', alarm_type: 'emergency_exit', room_id: 'Exit-2', message: 'Emergency Door Opened' },
  { device_id: 'DI_05', alarm_type: 'door_open', room_id: 'Ante-Room', message: 'Ante Room Door 2 Open' },
  { device_id: 'DI_06', alarm_type: 'panic_button', room_id: 'Chiller-5', message: 'PANIC BUTTON PRESSED' }
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sendAlarm() {
  const scenario = getRandomItem(SCENARIOS);

  const alarm = {
    ...scenario,
    status: 'active'
  };

  const payload = JSON.stringify(alarm);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/alarms',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`[${res.statusCode}] Sent: ${alarm.alarm_type} @ ${alarm.room_id}`);
    });
  });

  req.on('error', (error) => {
    console.error('Error sending alarm:', error.message);
  });

  req.write(payload);
  req.end();
}

// Send an alarm immediately
sendAlarm();
