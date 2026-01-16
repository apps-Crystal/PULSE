# PLC Configuration Guide

## 🔌 Siemens S7-1200/1500 Setup

This guide covers configuring your Siemens PLC to work with the Pulse monitoring system.

## Prerequisites

- TIA Portal V15 or later
- S7-1200 or S7-1500 PLC
- Ethernet connection to PLC
- Basic knowledge of TIA Portal

## Step 1: Enable Modbus TCP Server

### In TIA Portal:

1. **Open Device Configuration**
   - Double-click your PLC in the project tree
   - Go to "Device configuration"

2. **Add Modbus TCP Server**
   - Right-click on your PLC → "Properties"
   - Navigate to "General" → "Protection & Security"
   - Enable "Permit access with PUT/GET communication"

3. **Configure IP Address**
   - Select the PROFINET interface
   - Set static IP address (e.g., `192.168.1.104`)
   - Set subnet mask (e.g., `255.255.255.0`)
   - Note: This IP must match the `HOST` in `lib/modbus.js`

## Step 2: Configure Memory Areas

### Create Data Blocks for Sensors:

```
DB1 - Alarm Inputs
├── Coil 0 (M0.0) - Panic Button Room 001
├── Coil 1 (M0.1) - Door Sensor Room 001
├── Coil 2 (M0.2) - Emergency Room 101
└── ... (add more as needed)
```

### Memory Mapping:

| Address | Type | Description | Room |
|---------|------|-------------|------|
| M0.0 | BOOL | Panic Button | Room 001 |
| M0.1 | BOOL | Door Sensor | Room 001 |
| M0.2 | BOOL | Emergency | Room 101 |
| M0.3 | BOOL | Temperature Alarm | Chiller-1 |
| M0.4 | BOOL | Power Failure | Main-Power |

## Step 3: Ladder Logic for Sensors

### Example: Panic Button with Latch

```
Network 1: Panic Button Latch
      ┌─┐
I0.0──┤ ├──────────────────(S)─M0.0
      └─┘  Panic Button

Network 2: Reset
      ┌─┐
I0.1──┤ ├──────────────────(R)─M0.0
      └─┘  Reset Button
```

### Example: Door Open Timer

```
Network 1: Door Sensor with Delay
      ┌─┐        ┌───┐
I0.2──┤ ├────────┤TON├──────(S)─M0.1
      └─┘        └───┘
                  PT: T#5s
```

## Step 4: Modbus TCP Configuration

### Option A: Using Modbus TCP Library

1. **Add Modbus TCP Library**
   - In TIA Portal, go to "Instructions" → "Communication"
   - Add "MB_SERVER" function block

2. **Configure MB_SERVER**
   ```
   MB_SERVER Instance DB
   ├── ID: 1 (Slave ID)
   ├── DISCONNECT: FALSE
   ├── MB_HOLD_REG: DB2 (Holding Registers)
   └── MB_COILS: DB1 (Coils)
   ```

### Option B: Using S7 Communication

If Modbus is not available, use S7 protocol:

1. Update `lib/modbus.js` to use `node-snap7` instead
2. Configure PLC for S7 communication
3. Map memory areas directly

## Step 5: Webhook Integration (Optional)

For real-time push notifications from PLC:

### Using PLC HTTP Client:

```
Network 1: Send Alarm on Trigger
      ┌─┐        ┌──────────┐
M0.0──┤ ├────────┤HTTP_POST ├
      └─┘        └──────────┘
                 URL: http://your-server.com/api/alarms
                 Body: {"alarm_type":"panic_button",...}
```

**Note:** Not all S7-1200 models support HTTP client. Check your CPU specifications.

## Step 6: Testing

### Using ModbusPal Simulator:

1. **Download ModbusPal**
   - [ModbusPal Download](https://sourceforge.net/projects/modbuspal/)

2. **Create Slave**
   - Slave ID: 1
   - Port: 502
   - IP: 192.168.1.104

3. **Add Coils**
   - Address 0: Panic
   - Address 1: Door
   - Address 2: Emergency

4. **Test Connection**
   ```bash
   node scripts/test-lib-modbus.mjs
   ```

## Step 7: Physical Wiring

### Panic Button (NO - Normally Open)

```
+24V ────┬─── I0.0 (PLC Input)
         │
      [Button]
         │
GND ─────┴─── M (PLC Ground)
```

### Door Sensor (Magnetic Reed Switch)

```
+24V ────┬─── I0.2 (PLC Input)
         │
    [Reed Switch]
         │
GND ─────┴─── M (PLC Ground)
```

### Temperature Sensor (Analog)

```
Sensor Output ─── AI0 (Analog Input)
Sensor GND ────── M (PLC Ground)
Sensor +24V ───── L+ (PLC Supply)
```

**Convert Analog to Digital:**
```
Network 1: Temperature Threshold
      ┌───┐
AI0───┤ > ├──────(S)─M0.3
      └───┘
      25.0  (Threshold °C)
```

## Troubleshooting

### Cannot Connect to PLC

1. **Ping Test**
   ```bash
   ping 192.168.1.104
   ```

2. **Check Firewall**
   - Windows: Allow port 502
   - PLC: Ensure "Permit access with PUT/GET" is enabled

3. **Verify IP Configuration**
   - PLC and server must be on same subnet
   - No IP conflicts

### Coils Not Reading

1. **Check Memory Mapping**
   - Verify coil addresses in TIA Portal
   - Ensure DB is not write-protected

2. **Test with ModbusPal**
   - Isolate issue to PLC or application

3. **Enable Diagnostics**
   - In TIA Portal, monitor online values
   - Check for communication errors

## Advanced: Multiple PLCs

To monitor multiple PLCs:

1. **Update `lib/modbus.js`**
   ```javascript
   const PLCS = [
       { host: '192.168.1.104', port: 502, id: 1 },
       { host: '192.168.1.105', port: 502, id: 1 },
   ];
   ```

2. **Create Separate Endpoints**
   - `/api/modbus-data-plc1`
   - `/api/modbus-data-plc2`

3. **Aggregate in Dashboard**
   - Fetch from all endpoints
   - Merge alarm arrays

## Security Best Practices

1. **Network Segmentation**
   - Isolate PLC network from internet
   - Use VPN for remote access

2. **Access Control**
   - Set PLC password protection
   - Limit PUT/GET access to specific IPs

3. **Monitoring**
   - Log all Modbus connections
   - Alert on unauthorized access attempts

## Reference Documents

- [Siemens S7-1200 Manual](https://support.industry.siemens.com/)
- [Modbus TCP Specification](https://modbus.org/docs/Modbus_Messaging_Implementation_Guide_V1_0b.pdf)
- [TIA Portal Documentation](https://support.industry.siemens.com/cs/document/109742691/)

---

**For PLC programming support, consult a certified Siemens engineer.**
