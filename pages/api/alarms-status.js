export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Initialize if not exists (e.g. first call after restart)
    if (!global.monitorState) {
        global.monitorState = {
            alarms: [],
            latest: null
        };
    }

    return res.status(200).json({
        success: true,
        latest: global.monitorState.latest,
        history: global.monitorState.alarms
    });
}
