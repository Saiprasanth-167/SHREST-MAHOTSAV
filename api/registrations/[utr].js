module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { utr } = req.query;
        
        if (!utr) {
            return res.status(400).json({ error: 'UTR parameter is required' });
        }

        if (req.method === 'GET') {
            // Get registration by UTR
            // This would typically query your database
            // For now, returning a placeholder response
            return res.status(200).json({
                message: 'Registration endpoint',
                utr: utr,
                status: 'active'
            });
        }

        if (req.method === 'POST') {
            // Update registration status
            const { status } = req.body;
            
            return res.status(200).json({
                message: 'Registration updated successfully',
                utr: utr,
                status: status || 'pending'
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Error in registrations API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};