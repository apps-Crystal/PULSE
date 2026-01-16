import { getPlcData } from '../../lib/modbus';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const data = await getPlcData();

        if (!data) {
            return res.status(503).json({
                error: 'PLC Disconnected',
                message: 'Could not read from Modbus device'
            });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
