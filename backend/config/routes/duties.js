const express = require('express');
const router = express.Router();
const Duty = require('../models/Duty');

// Get all duties (дл€ обратной совместимости)
router.get('/', async (req, res) => {
    try {
        // ¬озвращаем дежурства за широкий период
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        
        const duties = await Duty.getByWeek(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );
        res.json(duties);
    } catch (error) {
        console.error('Error in GET /duties:', error);
        res.status(500).json({ error: 'Failed to fetch duties' });
    }
});

// Get duties for week
router.get('/week/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const duties = await Duty.getByWeek(startDate, endDate);
        res.json(duties);
    } catch (error) {
        console.error('Error in GET /duties/week:', error);
        res.status(500).json({ error: 'Failed to fetch duties' });
    }
});

// Create duty
router.post('/', async (req, res) => {
    try {
        const { date, hour, userId, customName } = req.body;
        
        if (!date || hour === undefined) {
            return res.status(400).json({ error: 'Date and hour are required' });
        }

        const dutyData = {
            date,
            hour: parseInt(hour),
            userId: userId ? parseInt(userId) : null,
            customName: customName || ''
        };

        const duty = await Duty.create(dutyData);
        res.status(201).json(duty);
    } catch (error) {
        console.error('Error in POST /duties:', error);
        res.status(500).json({ error: 'Failed to create duty' });
    }
});

// Update duty
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, customName } = req.body;

        const dutyData = {
            userId: userId ? parseInt(userId) : null,
            customName: customName || ''
        };

        const duty = await Duty.update(id, dutyData);
        res.json(duty);
    } catch (error) {
        console.error('Error in PUT /duties:', error);
        
        if (error.message === 'Duty not found') {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Failed to update duty' });
    }
});

// Delete duty
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Duty.delete(id);
        res.json({ message: 'Duty deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /duties:', error);
        
        if (error.message === 'Duty not found') {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Failed to delete duty' });
    }
});

// Clear week duties
router.delete('/week/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        await Duty.deleteByWeek(startDate, endDate);
        res.json({ message: 'Duties cleared successfully' });
    } catch (error) {
        console.error('Error in DELETE /duties/week:', error);
        res.status(500).json({ error: 'Failed to clear duties' });
    }
});

// Get statistics
router.get('/statistics/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const statistics = await Duty.getStatistics(startDate, endDate);
        res.json(statistics);
    } catch (error) {
        console.error('Error in GET /duties/statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;