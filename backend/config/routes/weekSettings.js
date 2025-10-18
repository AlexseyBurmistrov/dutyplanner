const express = require('express');
const router = express.Router();
const WeekSetting = require('../models/WeekSetting');

// Get week settings
router.get('/:weekStart', async (req, res) => {
    try {
        const { weekStart } = req.params;
        const setting = await WeekSetting.getByWeekStart(weekStart);
        
        if (!setting) {
            // Return default settings if not found
            return res.json({
                week_start: weekStart,
                work_days: WeekSetting.getDefaultWorkDays()
            });
        }
        
        res.json(setting);
    } catch (error) {
        console.error('Error in GET /week-settings/:weekStart:', error);
        res.status(500).json({ error: 'Failed to fetch week settings' });
    }
});

// Save week settings
router.post('/', async (req, res) => {
    try {
        const { weekStart, workDays } = req.body;
        
        if (!weekStart || !workDays || !Array.isArray(workDays)) {
            return res.status(400).json({ error: 'weekStart and workDays array are required' });
        }

        if (workDays.length === 0) {
            return res.status(400).json({ error: 'At least one work day must be selected' });
        }

        const setting = await WeekSetting.createOrUpdate(weekStart, workDays);
        res.json(setting);
    } catch (error) {
        console.error('Error in POST /week-settings:', error);
        res.status(500).json({ error: 'Failed to save week settings' });
    }
});

module.exports = router;