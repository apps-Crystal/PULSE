import { google } from 'googleapis';

// ==================== SHEET NAMES ====================
export const SHEETS = {
    EVENT_LEDGER: 'Event_Ledger',
    ROOMS: 'Rooms',
    CONFIG: 'Config'
};

// ==================== HEADERS ====================
export const HEADERS = {
    [SHEETS.EVENT_LEDGER]: [
        'Event_ID', 'Timestamp', 'Event_Type', 'Room_ID', 'Signal_State',
        'Paired_Event_ID', 'Duration_Sec', 'Severity',
        'Acknowledged', 'Ack_By', 'Ack_At', 'Notes'
    ],
    [SHEETS.ROOMS]: [
        'Room_ID', 'Label', 'Type', 'Slave_ID', 'Temp_Setpoint', 'Sensors', 'Active'
    ],
    [SHEETS.CONFIG]: [
        'Key', 'Value', 'Description'
    ]
};

// ==================== ENUMS ====================
export const EVENT_TYPES = {
    DOOR: 'DOOR',
    PANIC: 'PANIC',
    EMERGENCY_DOOR_1: 'EMERGENCY_DOOR_1',
    EMERGENCY_DOOR_2: 'EMERGENCY_DOOR_2',
    POWER_FAILURE: 'POWER_FAILURE'
};

export const SIGNAL_STATE = {
    ON: 'ON',   // triggered / opened / pressed / failed
    OFF: 'OFF'  // cleared / closed / released / restored
};

export const SEVERITY = {
    LOW: 'LOW',
    MED: 'MED',
    HIGH: 'HIGH',
    CRIT: 'CRIT'
};

// Auto-severity for ON events by type
const DEFAULT_SEVERITY = {
    [EVENT_TYPES.DOOR]: SEVERITY.LOW,
    [EVENT_TYPES.PANIC]: SEVERITY.CRIT,
    [EVENT_TYPES.EMERGENCY_DOOR_1]: SEVERITY.CRIT,
    [EVENT_TYPES.EMERGENCY_DOOR_2]: SEVERITY.CRIT,
    [EVENT_TYPES.POWER_FAILURE]: SEVERITY.CRIT
};

// ==================== CLIENT SINGLETON ====================
let sheetsClient = null;

function generateId(prefix = 'EVT') {
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).substring(2, 7);
    return `${prefix}_${ts}${rnd}`;
}

/**
 * Get authenticated Google Sheets client
 */
export async function getSheetsClient() {
    if (sheetsClient) return sheetsClient;

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!credentials.project_id || !sheetId) {
        console.warn('⚠️ Missing GOOGLE_CREDENTIALS or GOOGLE_SHEET_ID');
        return null;
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    sheetsClient = google.sheets({ version: 'v4', auth: client });
    return sheetsClient;
}

function getSheetId() {
    return process.env.GOOGLE_SHEET_ID;
}

// ==================== INIT ====================

/**
 * Initialize all 3 sheets with headers and seed data
 */
export async function initSheets() {
    const sheets = await getSheetsClient();
    if (!sheets) throw new Error('Sheets client not available');

    const sid = getSheetId();

    // Get existing sheet names
    const { data: spreadsheet } = await sheets.spreadsheets.get({ spreadsheetId: sid });
    const existing = spreadsheet.sheets.map(s => s.properties.title);

    // Create missing sheets
    const toCreate = Object.values(SHEETS).filter(name => !existing.includes(name));
    if (toCreate.length > 0) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: sid,
            resource: {
                requests: toCreate.map(title => ({ addSheet: { properties: { title } } }))
            }
        });
        console.log(`✅ Created sheets: ${toCreate.join(', ')}`);
    }

    // Write headers (only if row 1 is empty)
    for (const [sheetName, headers] of Object.entries(HEADERS)) {
        const lastCol = String.fromCharCode(64 + headers.length);
        const range = `${sheetName}!A1:${lastCol}1`;

        const { data } = await sheets.spreadsheets.values.get({
            spreadsheetId: sid, range
        }).catch(() => ({ data: { values: [] } }));

        if (!data.values || data.values.length === 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: sid, range,
                valueInputOption: 'RAW',
                resource: { values: [headers] }
            });
        }
    }

    // Seed Rooms if empty
    await _seedRooms(sheets, sid);

    // Seed Config if empty
    await _seedConfig(sheets, sid);

    return { success: true, sheets: Object.values(SHEETS) };
}

async function _seedRooms(sheets, sid) {
    const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: sid, range: `${SHEETS.ROOMS}!A2:A3`
    }).catch(() => ({ data: { values: [] } }));

    if (data.values && data.values.length > 0) return; // already seeded

    const rooms = [
        ['Chiller_Room_1', 'Chiller Room 1', 'Chiller', 1, -20, 'temp,door,panic', 'TRUE'],
        ['Chiller_Room_2', 'Chiller Room 2', 'Chiller', 2, -20, 'temp,door,panic', 'TRUE'],
        ['Chiller_Room_3', 'Chiller Room 3', 'Chiller', 3, -18, 'temp,door,panic', 'TRUE'],
        ['Chiller_Room_4', 'Chiller Room 4', 'Chiller', 4, 2, 'temp,door,panic', 'TRUE'],
        ['Chiller_Room_5', 'Chiller Room 5', 'Chiller', 5, 4, 'temp,door,panic', 'TRUE'],
        ['Chiller_Room_6', 'Chiller Room 6', 'Chiller', 6, 10, 'temp,door,panic', 'TRUE'],
        ['Frozen_Room_1', 'Frozen Room 1', 'Frozen', 8, -25, 'temp,door,panic', 'TRUE'],
        ['Frozen_Room_2', 'Frozen Room 2', 'Frozen', 9, -25, 'temp,door,panic', 'TRUE'],
        ['Frozen_Room_3', 'Frozen Room 3', 'Frozen', 10, -25, 'temp,door,panic', 'TRUE'],
        ['Frozen_Room_4', 'Frozen Room 4', 'Frozen', 11, -30, 'temp,door,panic', 'TRUE'],
        ['Frozen_Room_5', 'Frozen Room 5', 'Frozen', 12, -30, 'temp,door,panic', 'TRUE'],
        ['GLOBAL', 'Global Signals', 'Global', 7, '', 'emergency_door_1,emergency_door_2,power', 'TRUE']
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId: sid,
        range: `${SHEETS.ROOMS}!A:G`,
        valueInputOption: 'RAW',
        resource: { values: rooms }
    });
    console.log('✅ Seeded Rooms (11 rooms + GLOBAL)');
}

async function _seedConfig(sheets, sid) {
    const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: sid, range: `${SHEETS.CONFIG}!A2:A3`
    }).catch(() => ({ data: { values: [] } }));

    if (data.values && data.values.length > 0) return;

    const defaults = [
        ['POLLING_INTERVAL_MS', '2000', 'Modbus poll frequency in ms'],
        ['DOOR_WARN_THRESHOLD_SEC', '300', 'Door open WARNING after 5 min'],
        ['DOOR_CRIT_THRESHOLD_SEC', '900', 'Door open CRITICAL after 15 min'],
        ['POWER_CRIT_THRESHOLD_SEC', '60', 'Power outage CRITICAL after 1 min']
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId: sid,
        range: `${SHEETS.CONFIG}!A:C`,
        valueInputOption: 'RAW',
        resource: { values: defaults }
    });
    console.log('✅ Seeded Config defaults');
}

// ==================== EVENT LEDGER — CORE ====================

/**
 * Log an event (signal state change) to the ledger.
 * 
 * For ON events: creates a new row.
 * For OFF events: creates a new row AND pairs it with the matching ON event,
 *                 calculating duration.
 * 
 * @param {string} eventType - EVENT_TYPES value
 * @param {string} roomId - Room ID or 'GLOBAL'
 * @param {string} signalState - 'ON' or 'OFF'
 * @param {string} [notes] - optional notes
 * @returns {object} the created event, with pairing info if OFF
 */
export async function logEvent(eventType, roomId, signalState, notes = '') {
    const sheets = await getSheetsClient();
    if (!sheets) return null;

    const sid = getSheetId();
    const eventId = generateId();
    const timestamp = new Date().toISOString();
    const severity = signalState === SIGNAL_STATE.ON
        ? (DEFAULT_SEVERITY[eventType] || SEVERITY.MED)
        : SEVERITY.LOW;

    let pairedEventId = '';
    let durationSec = '';

    // If this is an OFF event, find and pair with the open ON event
    if (signalState === SIGNAL_STATE.OFF) {
        const openEvent = await findOpenEvent(eventType, roomId);
        if (openEvent) {
            pairedEventId = openEvent.Event_ID;
            const onTime = new Date(openEvent.Timestamp);
            const offTime = new Date(timestamp);
            durationSec = Math.round((offTime - onTime) / 1000);

            // Patch the original ON row with the paired ID
            await _patchPairedId(openEvent._rowIndex, eventId);
        }
    }

    const row = [
        eventId,
        timestamp,
        eventType,
        roomId,
        signalState,
        pairedEventId,
        durationSec,
        severity,
        'FALSE', // Acknowledged
        '',      // Ack_By
        '',      // Ack_At
        notes
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId: sid,
        range: `${SHEETS.EVENT_LEDGER}!A:L`,
        valueInputOption: 'RAW',
        resource: { values: [row] }
    });

    return {
        eventId,
        timestamp,
        eventType,
        roomId,
        signalState,
        pairedEventId: pairedEventId || null,
        durationSec: durationSec !== '' ? durationSec : null,
        severity
    };
}

/**
 * Find the most recent un-paired ON event for a given type+room.
 * An un-paired ON event has no Paired_Event_ID (column F is empty).
 */
export async function findOpenEvent(eventType, roomId) {
    const sheets = await getSheetsClient();
    if (!sheets) return null;

    const sid = getSheetId();
    const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: sid,
        range: `${SHEETS.EVENT_LEDGER}!A:L`
    });

    if (!data.values || data.values.length < 2) return null;

    const headers = data.values[0];

    // Search from bottom to top for most recent un-paired ON
    for (let i = data.values.length - 1; i >= 1; i--) {
        const row = data.values[i];
        const evt = {};
        headers.forEach((h, j) => { evt[h] = row[j] || ''; });

        if (
            evt.Event_Type === eventType &&
            evt.Room_ID === roomId &&
            evt.Signal_State === SIGNAL_STATE.ON &&
            !evt.Paired_Event_ID // un-paired
        ) {
            evt._rowIndex = i + 1; // 1-indexed for Sheets API
            return evt;
        }
    }

    return null;
}

/**
 * Patch the Paired_Event_ID on an existing ON row
 */
async function _patchPairedId(rowIndex, pairedId) {
    const sheets = await getSheetsClient();
    if (!sheets) return;

    await sheets.spreadsheets.values.update({
        spreadsheetId: getSheetId(),
        range: `${SHEETS.EVENT_LEDGER}!F${rowIndex}`,
        valueInputOption: 'RAW',
        resource: { values: [[pairedId]] }
    });
}

// ==================== QUERIES ====================

/**
 * Get events with optional filters
 * @param {object} filters
 * @param {string} [filters.eventType] - filter by type
 * @param {string} [filters.roomId] - filter by room
 * @param {string} [filters.signalState] - ON or OFF
 * @param {boolean} [filters.openOnly] - only un-paired ON events (currently active)
 * @param {boolean} [filters.unacknowledged] - only unacknowledged events
 * @param {number} [filters.limit] - max results (default 50)
 */
export async function getEvents(filters = {}) {
    const sheets = await getSheetsClient();
    if (!sheets) return [];

    const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: getSheetId(),
        range: `${SHEETS.EVENT_LEDGER}!A:L`
    });

    if (!data.values || data.values.length < 2) return [];

    const headers = data.values[0];
    let events = data.values.slice(1).map(row => {
        const evt = {};
        headers.forEach((h, i) => { evt[h] = row[i] || ''; });
        return evt;
    });

    // Apply filters
    if (filters.eventType) {
        events = events.filter(e => e.Event_Type === filters.eventType);
    }
    if (filters.roomId) {
        events = events.filter(e => e.Room_ID === filters.roomId);
    }
    if (filters.signalState) {
        events = events.filter(e => e.Signal_State === filters.signalState);
    }
    if (filters.openOnly) {
        // Active / currently open = ON events with no pair
        events = events.filter(e =>
            e.Signal_State === SIGNAL_STATE.ON && !e.Paired_Event_ID
        );
    }
    if (filters.unacknowledged) {
        events = events.filter(e =>
            e.Signal_State === SIGNAL_STATE.ON && e.Acknowledged !== 'TRUE'
        );
    }

    // Sort newest first
    events.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

    const limit = filters.limit || 50;
    return events.slice(0, limit);
}

// ==================== ACKNOWLEDGE ====================

/**
 * Acknowledge an event
 */
export async function acknowledgeEvent(eventId, userId, notes = '') {
    const sheets = await getSheetsClient();
    if (!sheets) return null;

    const sid = getSheetId();
    const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: sid,
        range: `${SHEETS.EVENT_LEDGER}!A:L`
    });

    if (!data.values || data.values.length < 2) return null;

    // Find the row
    let rowIndex = -1;
    for (let i = 1; i < data.values.length; i++) {
        if (data.values[i][0] === eventId) {
            rowIndex = i + 1; // 1-indexed
            break;
        }
    }
    if (rowIndex === -1) return null;

    const ackAt = new Date().toISOString();

    // Update columns I (Acknowledged), J (Ack_By), K (Ack_At), L (Notes)
    await sheets.spreadsheets.values.update({
        spreadsheetId: sid,
        range: `${SHEETS.EVENT_LEDGER}!I${rowIndex}:L${rowIndex}`,
        valueInputOption: 'RAW',
        resource: {
            values: [['TRUE', userId, ackAt, notes]]
        }
    });

    return { eventId, acknowledgedBy: userId, acknowledgedAt: ackAt };
}

// ==================== CONFIG HELPERS ====================

/**
 * Get all config as key-value object
 */
export async function getConfig() {
    const sheets = await getSheetsClient();
    if (!sheets) return {};

    const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: getSheetId(),
        range: `${SHEETS.CONFIG}!A:C`
    });

    const config = {};
    if (data.values && data.values.length > 1) {
        for (let i = 1; i < data.values.length; i++) {
            config[data.values[i][0]] = data.values[i][1];
        }
    }
    return config;
}

/**
 * Get a single config value
 */
export async function getConfigValue(key) {
    const config = await getConfig();
    return config[key];
}

// ==================== ROOMS HELPERS ====================

/**
 * Get all rooms
 */
export async function getRooms() {
    const sheets = await getSheetsClient();
    if (!sheets) return [];

    const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: getSheetId(),
        range: `${SHEETS.ROOMS}!A:G`
    });

    if (!data.values || data.values.length < 2) return [];

    const headers = data.values[0];
    return data.values.slice(1).map(row => {
        const room = {};
        headers.forEach((h, i) => { room[h] = row[i] || ''; });
        return room;
    });
}
