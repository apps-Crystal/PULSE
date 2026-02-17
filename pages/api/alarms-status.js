import { getEvents, acknowledgeEvent } from '@/lib/sheetDb';

// In-memory fallback
if (!global.monitorState) {
    global.monitorState = { alarms: [], latest: null };
}

/**
 * GET /api/alarms-status
 * 
 * Query events from the ledger.
 * 
 * Query params:
 *   type        - filter by Event_Type (DOOR, PANIC, etc.)
 *   room_id     - filter by Room_ID
 *   state       - filter by Signal_State (ON / OFF)
 *   open_only   - show only currently active (un-paired ON) events
 *   unacked     - show only un-acknowledged ON events
 *   limit       - max results (default 50)
 * 
 * PUT /api/alarms-status
 * 
 * Acknowledge an event.
 * Body: { event_id, user_id, notes? }
 */
export default async function handler(req, res) {
    // ---- GET: Query events ----
    if (req.method === 'GET') {
        try {
            const filters = {
                eventType: req.query.type || undefined,
                roomId: req.query.room_id || undefined,
                signalState: req.query.state || undefined,
                openOnly: req.query.open_only === 'true',
                unacknowledged: req.query.unacked === 'true',
                limit: parseInt(req.query.limit) || 50
            };

            const events = await getEvents(filters);

            // Also get currently active events count
            const active = await getEvents({ openOnly: true, limit: 200 });

            return res.status(200).json({
                success: true,
                latest: global.monitorState.latest,
                events,
                activeCount: active.length,
                total: events.length
            });
        } catch (error) {
            // Fallback to in-memory
            console.warn('⚠️ Sheets query failed, using cache:', error.message);
            return res.status(200).json({
                success: true,
                latest: global.monitorState.latest,
                events: global.monitorState.alarms,
                fallback: true
            });
        }
    }

    // ---- PUT: Acknowledge event ----
    if (req.method === 'PUT') {
        try {
            const { event_id, user_id, notes } = req.body;

            if (!event_id || !user_id) {
                return res.status(400).json({
                    error: 'event_id and user_id are required'
                });
            }

            const result = await acknowledgeEvent(event_id, user_id, notes);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    error: `Event ${event_id} not found`
                });
            }

            console.log(`✅ [Ack] ${event_id} by ${user_id}`);
            return res.status(200).json({ success: true, data: result });

        } catch (error) {
            console.error('❌ Ack error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ error: 'Use GET or PUT' });
}
