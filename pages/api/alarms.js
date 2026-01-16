import { getGoogleSheetsClient } from '@/lib/googleSheets';

// Global cache for the latest alarm (in-memory, resets on server restart)
// In a production app, use Redis or a real database.
if (!global.monitorState) {
    global.monitorState = {
        alarms: [],
        latest: null
    };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            device_id,
            alarm_type,
            room_id,
            status,
            message
        } = req.body;

        if (!device_id || !alarm_type || !room_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const timestamp = new Date().toISOString();
        const newAlarm = { timestamp, device_id, alarm_type, room_id, status, message };

        // Update in-memory cache for the dashboard
        global.monitorState.latest = newAlarm;
        global.monitorState.alarms.unshift(newAlarm);
        if (global.monitorState.alarms.length > 50) {
            global.monitorState.alarms.pop(); // Keep last 50
        }

        console.log(`✅ [Webhook] Received: ${alarm_type} in ${room_id}`);

        // Try to log to Google Sheets (non-blocking)
        const sheets = await getGoogleSheetsClient();
        if (sheets && process.env.GOOGLE_SHEET_ID) {
            try {
                await sheets.spreadsheets.values.append({
                    spreadsheetId: process.env.GOOGLE_SHEET_ID,
                    range: 'Sheet1!A:G',
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [[timestamp, device_id, alarm_type, room_id, status, message, '']]
                    }
                });
            } catch (sheetError) {
                console.error("⚠️ Failed to append to Google Sheet:", sheetError.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Alarm logged successfully',
            data: newAlarm
        });

    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
