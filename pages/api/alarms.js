import { logEvent, acknowledgeEvent, EVENT_TYPES, SIGNAL_STATE } from '@/lib/sheetDb';

// In-memory cache for dashboard live updates
if (!global.monitorState) {
    global.monitorState = { alarms: [], latest: null };
}

// Valid event types from modbus signals
const VALID_TYPES = Object.values(EVENT_TYPES);

/**
 * POST /api/alarms
 * 
 * Log a signal state change to the Event_Ledger.
 * 
 * Body: {
 *   event_type: 'DOOR' | 'PANIC' | 'EMERGENCY_DOOR_1' | 'EMERGENCY_DOOR_2' | 'POWER_FAILURE',
 *   room_id: 'Chiller_Room_1' | 'GLOBAL' | ...,
 *   signal_state: 'ON' | 'OFF',
 *   notes?: string
 * }
 * 
 * For backward compatibility, also accepts:
 *   device_id, alarm_type, status, message
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Use POST' });
    }

    try {
        // Support both new and legacy field names
        const {
            event_type, alarm_type,
            room_id,
            signal_state, status,
            notes, message,
            device_id
        } = req.body;

        const eventType = event_type || _mapLegacyType(alarm_type);
        const roomId = room_id || 'UNKNOWN';
        const signalState = signal_state || _mapLegacyStatus(status);
        const eventNotes = notes || message || '';

        // Validate
        if (!eventType || !VALID_TYPES.includes(eventType)) {
            return res.status(400).json({
                error: `Invalid event_type. Must be one of: ${VALID_TYPES.join(', ')}`,
                received: eventType
            });
        }
        if (!signalState || !['ON', 'OFF'].includes(signalState)) {
            return res.status(400).json({
                error: 'signal_state must be ON or OFF',
                received: signalState
            });
        }
        if (!roomId) {
            return res.status(400).json({ error: 'room_id is required' });
        }

        // Log event to sheet
        const event = await logEvent(eventType, roomId, signalState, eventNotes);

        if (!event) {
            return res.status(500).json({
                success: false,
                error: 'Failed to log event — check Google Sheets connection'
            });
        }

        // Update in-memory cache for live dashboard
        const cacheEntry = {
            ...event,
            device_id: device_id || 'PLC'
        };
        global.monitorState.latest = cacheEntry;
        global.monitorState.alarms.unshift(cacheEntry);
        if (global.monitorState.alarms.length > 100) {
            global.monitorState.alarms.pop();
        }

        const action = signalState === 'ON' ? 'triggered' : 'cleared';
        console.log(`✅ [Event] ${eventType} ${action} in ${roomId}${event.durationSec != null ? ` (${event.durationSec}s)` : ''}`);

        return res.status(200).json({
            success: true,
            data: event
        });

    } catch (error) {
        console.error('❌ Error logging event:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Map legacy alarm_type to new EVENT_TYPES
 */
function _mapLegacyType(alarmType) {
    const map = {
        'panic': EVENT_TYPES.PANIC,
        'door_open': EVENT_TYPES.DOOR,
        'door': EVENT_TYPES.DOOR,
        'emergency': EVENT_TYPES.EMERGENCY_DOOR_1,
        'power_failure': EVENT_TYPES.POWER_FAILURE
    };
    return map[alarmType] || alarmType?.toUpperCase();
}

/**
 * Map legacy status to signal state
 */
function _mapLegacyStatus(status) {
    if (!status) return undefined;
    const s = status.toLowerCase();
    if (['active', 'triggered', 'open', 'on'].includes(s)) return SIGNAL_STATE.ON;
    if (['resolved', 'cleared', 'closed', 'off'].includes(s)) return SIGNAL_STATE.OFF;
    return undefined;
}
