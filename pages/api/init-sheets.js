import { initSheets, getConfig, getRooms } from '@/lib/sheetDb';

/**
 * POST /api/init-sheets
 * 
 * Creates the 3-sheet structure (Event_Ledger, Rooms, Config)
 * and seeds default data. Run once.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Use POST' });
    }

    try {
        const result = await initSheets();
        const config = await getConfig();
        const rooms = await getRooms();

        return res.status(200).json({
            success: true,
            message: 'Sheets initialized',
            data: {
                sheets: result.sheets,
                configKeys: Object.keys(config).length,
                rooms: rooms.length
            }
        });
    } catch (error) {
        console.error('❌ Init error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            hint: 'Make sure the sheet is shared with the service account email as Editor'
        });
    }
}
