const express = require('express');
const router = express.Router();
const Absence = require('../models/Absence');

// Get all absences
router.get('/', async (req, res) => {
    try {
        const absences = await Absence.getAll();
        res.json(absences);
    } catch (error) {
        console.error('Error in GET /absences:', error);
        res.status(500).json({ error: 'Failed to fetch absences' });
    }
});

// Create absence
router.post('/', async (req, res) => {
    try {
        const { userId, startDate, endDate, reason } = req.body;
        
        if (!userId || !startDate || !endDate) {
            return res.status(400).json({ error: 'userId, startDate, and endDate are required' });
        }

        const absenceData = {
            userId: parseInt(userId),
            startDate,
            endDate,
            reason: reason || ''
        };

        const absence = await Absence.create(absenceData);
        res.status(201).json(absence);
    } catch (error) {
        console.error('Error in POST /absences:', error);
        
        if (error.message.includes('Start date cannot be after end date')) {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Failed to create absence' });
    }
});

// Delete absence
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Absence.delete(id);
        res.json({ message: 'Absence deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /absences:', error);
        
        if (error.message === 'Absence not found') {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Failed to delete absence' });
    }
});

// Get absences by user and date
router.get('/user/:userId/date/:date', async (req, res) => {
    try {
        const { userId, date } = req.params;
        const absences = await Absence.getByUserAndDate(parseInt(userId), date);
        res.json(absences);
    } catch (error) {
        console.error('Error in GET /absences/user/:userId/date/:date:', error);
        res.status(500).json({ error: 'Failed to fetch absences' });
    }
});

module.exports = router;