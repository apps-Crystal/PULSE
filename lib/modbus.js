// Bridge Server API Client
// Replaces direct Modbus connection with HTTP calls to local bridge server

const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001';
const API_KEY = process.env.NEXT_PUBLIC_BRIDGE_API_KEY || 'pulse_dev_key_change_in_production';

/**
 * Fetches PLC data from the bridge server.
 * Returns the same structure as the original getPlcData() for compatibility.
 */
export async function getPlcData() {
    try {
        const response = await fetch(`${BRIDGE_URL}/api/plc-data`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            // Add timeout
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ Bridge authentication failed - check API key');
            } else if (response.status === 503) {
                console.warn('⚠️ Bridge server reports PLCs offline');
            }
            throw new Error(`Bridge API error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            throw new Error('Invalid response from bridge server');
        }

        return result.data;
    } catch (error) {
        if (error.name === 'TimeoutError') {
            console.error('❌ Bridge server timeout - is it running?');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('❌ Cannot connect to bridge server - is it running?');
        } else {
            console.error('❌ Error fetching PLC data from bridge:', error.message);
        }
        return null;
    }
}

/**
 * Checks if the bridge server is healthy.
 * Returns health status object or null if unreachable.
 */
export async function checkBridgeHealth() {
    try {
        const response = await fetch(`${BRIDGE_URL}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.warn('⚠️ Bridge health check failed:', error.message);
        return null;
    }
}

